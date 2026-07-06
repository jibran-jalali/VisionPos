from __future__ import annotations

import uvicorn

from config import settings


def main() -> None:
    uvicorn.run("api:app", host=settings.host, port=settings.port, reload=True)


if __name__ == "__main__":
    main()
