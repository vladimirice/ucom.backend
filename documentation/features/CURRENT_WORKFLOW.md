# Current workflow

[JPEG Schema](../jpg/current-workflows.jpg)

Notes:
* In every valuable business action frontend application, backend API application and blockchain application are involved.
* Social transactions are signed by frontend application but are pushed to the blockchain by backend application.
* Wallet transactions are signed and pushed by the frontend application. Backend application fetches transactions from the blockchain
and updates it's own cache to provide it to the frontend.
* There is no business logic validation on the blockchain API. The backend application validates all business logic.
