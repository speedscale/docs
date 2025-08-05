import RRPairList from './modify-rrpairs/rrpair-list.png'
import RRPairDetail from './modify-rrpairs/rrpair-response-detail.png'

#  Modifying Tests/Mocks

Use this guide to  modify your tests or mock responses in an existing proxymock recording. Any modifications made will automatically show up the next time you run proxymock.

## Before you begin

Make sure you have:

- proxymock [installed](../getting-started/quickstart/quickstart-cli.md)
- existing proxymock recording (like this [one](https://github.com/speedscale/outerspace-go/tree/main/proxymock))
- (optional) set $EDITOR environment varaible inr your terminal (ex: `export EDITOR=code`)

## Editing from the TUI

proxymock provides a terminal UI for viewing request/response pairs (RRPairs). Open this view opening a terminal,  switching to the parent directory of your recording and running:

```shell
proxymock inspect
```

<img src={RRPairList} alt="proxymock tui" width="500" style={{ display: 'block', margin: '0 auto' }} />

Press the `e` key to open an RRPair in your editor of choice. Your `$EDITOR` environment variable must be set for this to work.

Modify the RRPair and save the file. proxymock will **automatically** update its view. The next time you run proxymock as a mock or test server the new data will be used.


## Editing raw files

If you don't want to use the terminal UI, you can navigate the proxymock files and edit them like normal markdown. Each recording is srored in its own directory under the `proxymock` parent directory.


For more information about the RRPair file format, check this [link](../how-it-works/rrpair-format.md).
For more information about how mock signatures are built from the raw traffic recording see this [link](../how-it-works/signature.md).