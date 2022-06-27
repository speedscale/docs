
# Snapshot Configuration

These are used to process traffic into known patterns.

Tokenizers are described by a configuration file that has 4 parts:

```
{
    "in": [],
    "out": [],
    "preProcess": [],
    "postProcess": []
}
```

Each of the parts contains a list of tokenizers that should be run:

* **in** tokenizers run on traffic going into your service. For example, if users have to authenticate with the service, you may use some kind of authentication related tokenizer.
* **out** tokenizers run on traffic leaving your service.
* **preProcess** tokenizers are used in case the traffic needs to be modified ahead of time, for example if everything was zipped or encoded in a special way.
* **postProcess** tokenizers are used if you with traffic to be modified after all other tokenizers.

