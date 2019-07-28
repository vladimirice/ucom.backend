# Improvements and scaling strategies

## Database optimisations

### Entities processing

**Strategy:**
Use the Postgres CTE and array aggregate features instead of the separate requests: 
* First - for the entity itself.
* Second - for a related activity.
* Further merging on the application layer. 

There is a better solution.

**Explanation:**
Almost every entity has an activity related to it (for ex. users who follows community).
If an activity data is included inside entity JSON API response then it is possible to use CTE to prepare all request
parts. And then represent activity data as JSON column for a every required entity.
