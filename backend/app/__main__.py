import logging

from app.cli import main as cli_main

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def main() -> None:
    cli_main()


if __name__ == "__main__":
    main()
