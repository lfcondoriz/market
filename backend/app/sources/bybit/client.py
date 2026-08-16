from pybit.unified_trading import HTTP


def create_client() -> HTTP:
    return HTTP(testnet=False)
