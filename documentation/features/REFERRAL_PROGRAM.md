# Referral program

A referral link structure:
https://hello.u.community/{referral_program_id}/{referrer_identity}/?{utm_labels_query_string}

example:
https://hello.u.community/Hv1a/spirinspirin/?utm_source=fb&utm_content=small&sub1=supersub1&sub2=supersub2


TODO


## Draft notes

----------Task ---------

Database tables and models

SCHEMA referral

TABLES
programs
clicks
conversions



------------------------

A redirect workflow




------------------------

API to fetch a referral status


------------------------

An API to show referrals as for followers

Describe

------------------------

A workflow description:

User himself workflow:
* Fresh user - newcomer
* There is a referral link somewhere. It is like

* User clicks on this link.

-------------- A redirect server workflow --------------------
* A redirect server process the request:
- Fetch a unique id from the cookie if there is any cookie
- Unique id should be per referral program id
- generate a unique user identity if there is no any cookie. It is not possible to use record ID. Cookie should be secure, http-only and signed by the signature
- save a Query string, created_at, etc - create a `click record`

- save a unique ID to the cookie and set a cookie on the domain .u.community (as for GitHub)
- determine a redirect rules (flow like) and build a redirect link
- redirect a user to the registration (or to the custom link)

----------------------------------------------

User himself registration:

User is on the registration page
There is an api to receive referral data by referral cookie

Case 1:

* The User just follow the registration and registered successfully
* User adds signed referral transaction to the request

Backend API:
* Make a regular registration
* Set a redlock on the unique request
* Fetch a cookie from the request, find a click and process a referral program rules represented by type field.
** Validate a cookie.
** Create a conversion message.
** If required check `already participated condition` - if there is already a conversion of the same uniqid then skip it
* This process should by async and is processed by a cron or a queue.
* Return a success message to the frontend and add an extra information about a referral program processing

Case 2:
* The user leaves the registration.
* One day is passed and user returns back but directly to the registration
* User registers himself
* Process is the same as for the case 1.

Case 3:
User:
* leaves the registration.
* find another link of the same program but of the different user
* follows the link
* A cookie is rewritten

Case 4:
* User leaves the registration
* User clean the cookies or never returns
* No conversion. Only a click record

Case 5:
* The same user follows the same link again (or set himself the same cookie again, manually)
* The same user registers a new account using the same cookie
* is it required to provide an expiration policy like `only one participation per referral program`?


TODO
How to create a model of attribution for the different partnership programs
* how to set unique id
* Where to store it - it is not possible to use one cookie for all requests.

Or
* find all referral programs inside the `clicks` related to the uniqid
* check the expiration - it must be a info inside referral_program table, not a `cookie expiration time`
* For every new click create or refresh a cookie. Set the expiration if half a year


Two different cookies
* Cookie with user unique ID
* A cookie with user participation information
{
    uniqueid: 12345,
    some_identity: 12345,
}

referral_id - different
uniqid - same
