# For reference

## Blockchain MongoDB plugin indexes

### transaction_traces

```
account_and_name_and_from_and_to_ids
{
  "action_traces.act.account" : 1,
  "action_traces.act.name" : 1,
  "action_traces.act.data.from" : 1,
  "action_traces.act.data.to" : 1
}

account_and_name_idx
{
  "action_traces.act.account" : 1,
  "action_traces.act.name" : 1
}
```