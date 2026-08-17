import argparse
import logging

from app.db.create_tables import ensure_tables_exist
from app.ingestion.funding_rates import ingest_funding_rates
from app.ingestion.instruments import ingest_instruments
from app.repositories.instruments_repository import count_instruments

logger = logging.getLogger(__name__)

SYMBOL_TYPES = [
    "innovation",
    "stock",
    "commodity",
    "uncategorized",
]



def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Market data ingestion CLI",
    )

    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
        help="Available commands",
    )

    # ------------------------------------------------------------------
    # Subcommand: instruments
    # ------------------------------------------------------------------
    parser_instruments = subparsers.add_parser(
        "instruments",
        help="Refresh market instruments.",
    )
    parser_instruments.add_argument(
        "--category",
        required=True,
        help="Bybit category to process.",
    )

    # ------------------------------------------------------------------
    # Subcommand: funding
    # ------------------------------------------------------------------
    parser_funding = subparsers.add_parser(
        "funding",
        help="Ingest funding rates.",
    )
    parser_funding.add_argument(
        "--category",
        required=True,
        help="Bybit category to process.",
    )

    target_group = parser_funding.add_mutually_exclusive_group(required=True)
    target_group.add_argument(
        "--symbol",
        nargs="+",
        help=(
            "One or more symbols to ingest funding rates for. "
            "Example: BTCUSDT ETHUSDT."
        ),
    )
    target_group.add_argument(
        "--all",
        action="store_true",
        help="Ingest funding rates for all eligible symbols.",
    )

    parser_funding.add_argument(
        "--symbol-type",
        choices=SYMBOL_TYPES,
        help="Filter symbols by Bybit symbol type when using --all.",
    )

    parser_funding.add_argument(
        "--reset-history",
        action="store_true",
        help=(
            "Force a full historical backfill for the selected "
            "funding-rate symbols."
        ),
    )

    return parser


def validate_args(
    parser: argparse.ArgumentParser,
    args: argparse.Namespace,
) -> None:
    if args.command == "funding":
        if args.symbol_type and not args.all:
            parser.error("--symbol-type can only be used with --all")


def ensure_instruments(category: str) -> None:
    """
    Ensure that instruments exist before running operations that depend on them.
    """
    count = count_instruments(category=category)

    if count > 0:
        return

    logger.info(
        "No instruments found for category '%s'. Initializing instruments...",
        category,
    )

    ingest_instruments(category=category)

    count = count_instruments(category=category)

    if count == 0:
        raise RuntimeError(
            f"Could not initialize instruments for category '{category}'."
        )


def run_funding(args: argparse.Namespace) -> None:
    """
    Run funding ingestion after ensuring its prerequisites.
    """
    ensure_instruments(category=args.category)

    if args.symbol:
        ingest_funding_rates(
            category=args.category,
            symbols=args.symbol,
            reset_history=args.reset_history,
        )
        return

    ingest_funding_rates(
        category=args.category,
        symbol_type=args.symbol_type,
        reset_history=args.reset_history,
    )


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    validate_args(parser, args)

    ensure_tables_exist()

    if args.command == "instruments":
        ingest_instruments(category=args.category)
        return

    if args.command == "funding":
        run_funding(args)
        return


if __name__ == "__main__":
    main()
