import { startSession } from "mongoose";
import Gallery from "../schema/gallerySchema.js";
import User from "../schema/userSchema.js";

async function loadGalleryHistory(userID) {
	const isExists = await User.exists({userID});
	if(isExists) {
		const data = await User.findOne({userID});
		return data.history;
	}
	return new Map();
}

async function updateUserGallery(userID, galleryID, session) {
	const isExists = await User.exists({userID});
	const now = Date.now();

	if(isExists) {
		const history = await loadGalleryHistory(userID);
		history.set(galleryID, now);
		return User.findOneAndUpdate({userID}, {history}).session(session);
	}
	const history = {[galleryID]: now};
	return User.create([{
		userID,
		isShared: false,
		lastShareModified: now,
		lastModified: now,
		history,
	}], {session});
}

async function loadShareStatus(userID) {
	const isExists = await User.exists({userID});
	if(isExists) {
		const data = await User.findOne({userID});
		return data.isShared;
	}
	return null;
}

async function saveGallery(userID, galleryData) {
	const session = await startSession();
	try {
		session.startTransaction();
		const [createdData] = await Gallery.create([galleryData], {session});
		const galleryID = createdData._id.valueOf();
		await updateUserGallery(userID, galleryID, session);
		await session.commitTransaction();
		session.endSession();
		return galleryID;
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		console.log(err);
		return null;
	}
}

async function loadGallery(userID, galleryID) {
	if(typeof galleryID !== "string" || galleryID.length !== 24) {
		return { success: false, err: "bad_request" };
	}
	if (await User.exists({userID}) === false) return { success: false, err: "no user" };

	const { history } = await User.findOne({userID});
	if ( !history.has(galleryID) ) return { success: false, err: "don't have gallery" };

	const galleryData = await Gallery.findById(galleryID);
	if (galleryData === null) return { success: false, err: "no gallery" };

	return { success: true, data: galleryData };
}

async function loadLastGalleryID(userID) {
	const history = await loadGalleryHistory(userID);
	const [result] = [...history].reduce( ([rescentID, rescentDate], [galleryID, date])=>{
		if(rescentDate < date) return [galleryID, date];
		return [rescentID, rescentDate];
	}, [null, 0] );

	return result;
}

async function loadLastGallery(userID) {
	const galleryID = await loadLastGalleryID(userID);
	if (galleryID === null) return null;
	return Gallery.findById(galleryID);
}

export { 
	loadShareStatus, 
	saveGallery, 
	loadGallery, 
	loadLastGallery, 
	loadLastGalleryID, 
	loadGalleryHistory as loadUserGalleryList 
};