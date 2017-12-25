# react-native-emoji-selector

## Demo



## Installation

```
npm install --save react-native-emoji-selector
```

```
import EmojiSelector from 'react-native-emoji-selector'
```

## Usage

```jsx
<EmojiSelector
    onEmojiSelect={emoji => console.log(emoji)}
/>
```

|Prop|Type|Default|Description|
|---|---|---|---|
|onEmojiSelect|*func*| |Function called when a user selects an Emoji|
|theme|*string*|`007AFF`|Theme color used for loaders and active tab indicator|
|showTabs|*bool*|`true`|Toggle the tabs on or off|
|showSearchbar|*bool*|`true`|Toggle the searchbar on or off
|category|*enum*|`.all`|Set the default category. Use the `Categories` class|
|columns|*number*|`6`|Number of columns accross|

## To do
* Improve performance of switching tabs
* Show loaders when loading a category