from fastapi import FastAPI
# from konlpy.tag import Kkma
# from konlpy.utils import pprint

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello World"}