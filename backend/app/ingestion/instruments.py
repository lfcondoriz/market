from app.repositories.instruments_repository import upsert_instruments
from app.sources.bybit.client import create_client
from app.sources.bybit.instruments_source import fetch_instruments_from_bybit
from app.transformations.instruments_transformer import transform_instrument_list


def ingest_instruments(
    category: str = "linear",
) -> None:

    client = create_client()

    raw_instruments = fetch_instruments_from_bybit(
        client=client,
        category=category,
    )

    instruments = transform_instrument_list(
        raw_instruments,
        category=category,
    )

    processed = upsert_instruments(instruments)

    print(
        f"Instrumentos: "
        f"recibidos={len(raw_instruments)}, "
        f"procesados={processed}"
    )


def main() -> None:
    ingest_instruments()


if __name__ == "__main__":
    main()
