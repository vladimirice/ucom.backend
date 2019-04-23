# Infrastructure

## External resources

### Production

description | destination
--- | ---
MongoDB | 95.216.207.224
Blockchain API load balancer | https://mini-mongo.u.community:7889
Calculator API load balancer | https://web-calculator-node.u.community:7889

### Staging

description | destination
--- | ---
MongoDB | 142.93.100.96
Blockchain API | https://staging-api-node-2.u.community:7888
Calculator API | https://staging-web-calculator-node-1.u.community:7889

## Steps to create a new node for web application
* Create a node itself
* Create a domain name, follow the name convention 
* Provide an access to an API through NGINX (SSL)
* Increase a default NGINX post limit up to 200M
* Disable CORS policy (for beta implementations)
* Implement a monitoring. See above.

### Blockchain nodes monitoring:
* Server itself. Basic Zabbix metrics - CPU, RAM, Disc, etc.
* Node itself. A get_info HTTP response status must be 200. 
Example request: https://mini-mongo.u.community:7889/v1/chain/get_info
* Last block delay. `head_block_time` delay should be no more than 10 minutes.
* A load balancer (NGINX) monitoring if exists.

