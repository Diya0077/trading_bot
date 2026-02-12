from setuptools import setup, find_packages

setup(
    name='tradebot',
    version='0.1.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'python-binance',
        'typer[all]',
        'rich',
        'pyfiglet',
        'python-dotenv',
        'pydantic'
    ],
    entry_points={
        'console_scripts': [
            'tradebot=cli.cli:app',
        ],
    },
)
