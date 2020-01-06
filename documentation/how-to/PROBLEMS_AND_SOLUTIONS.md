# Problems and solutions

**Problem**: 
Failed to Setup IP tables: Unable to enable SKIP DNAT rule:  (iptables failed: iptables --wait -t nat -I DOCKER

**Solution**
iptables -t nat -N DOCKER
-----------------
**Problem**: A lot of JEST_TIMEOUT appeared after refactoring.

**Solution**: A method like signTransaction is moved from one class to another and mock in MockHelper is not changed
