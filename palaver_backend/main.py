from fastapi import FastAPI

app = FastAPI(title="Palaver Backend")


@app.get("/status")
def status():
    return {"status": "ok"}
