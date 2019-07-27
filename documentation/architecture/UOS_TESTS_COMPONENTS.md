# UOS tests components

![UOS test components](https://raw.githubusercontent.com/UOSnetwork/ucom.backend/master/documentation/jpg/uos-test-components.jpg)

Goal: create a testing ecosystem, simplify a testing process, and make it more effective.

How to accomplish? A description is based on example - user upvotes post.

Step 1 - database seeding:
* Let's create a new post beforehand.
* Posts have to be created using existing backend API.
* Create a dedicated PostGenerator class.
* Inside this class request the backend API.
* Making requests is a very common task. Let's create CommonRequestHelper class and pass new post parameters to the
request methods.

Step 2 - create a vote from user:
* Again, the vote is created using a backend API as the client application does.
* Create a dedicated VotesGenerator class.
* Inside this class request the backend API.
* We already have a CommonRequestHelper. Pass vote request parameters to its methods.

Step 3 - expect correct voting action:
* Create a dedicated VotingResponseChecker.
* Checking that an HTTP response has correct status and not empty body is a common task. Let's create CommonChecker class and check (expect) it.
* Make a regular integration tests checks inside the VotingResponseChecker:
    * fetch the action record and check it
    * check post's number of votes
    * etc.
