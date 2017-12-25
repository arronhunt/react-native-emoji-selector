# react-native-emoji-selector

![Image preview](./example/assets/cover.png)

## Installation

```
npm install --save react-native-emoji-selector
```

```
import EmojiSelector from 'react-native-emoji-selector'
```

## Demo

![Demo GIF](./example/assets/demo.gif)

## Usage

### Basic usage
```jsx
<EmojiSelector
    onEmojiSelect={emoji => console.log(emoji)}
/>
```

### Setting a default category
If you'd like to define a different default category, you can import the `Categories` class.

```jsx
import EmojiSelector, { Categories } from 'react-native-emoji-selector';

<EmojiSelector
    category={Categories.symbols}
    onEmojiSelect={emoji => console.log(emoji)}
/>
```

The available categories are `all`, `people`, `nature`, `food`, `activities`, `places`, `objects`, `symbols`, and `flags`. 

## Props

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