# react-native-emoji-selector

![Image preview](./assets/cover.png)

## Installation

```
npm install --save react-native-emoji-selector
```

```
import EmojiSelector from 'react-native-emoji-selector'
```

## Demo

![Demo GIF](./assets/demo.gif)

## Usage

### Basic usage

```jsx
<EmojiSelector onEmojiSelected={emoji => console.log(emoji)} />
```

### Setting a default category

If you'd like to define a different default category, you can import the `Categories` class. Setting a default category can also improve performance by loading a single section rather than all sections at once.

```jsx
import EmojiSelector, { Categories } from "react-native-emoji-selector";

<EmojiSelector
  category={Categories.symbols}
  onEmojiSelected={emoji => console.log(emoji)}
/>;
```

The available categories are `all`, `emotion`, `people`, `nature`, `food`, `activities`, `places`, `objects`, `symbols`, and `flags`.

## Props

| Prop              | Type     | Default       | Description                                              |
| ----------------- | -------- | ------------- | -------------------------------------------------------- |
| onEmojiSelected   | _func_   |               | Function called when a user selects an Emoji             |
| theme             | _string_ | `"007AFF"`    | Theme color used for loaders and active tab indicator    |
| showTabs          | _bool_   | `true`        | Toggle the tabs on or off                                |
| showSearchBar     | _bool_   | `true`        | Toggle the searchbar on or off                           |
| showHistory       | _bool_   | `false`       | Toggle the history tab on or off                         |
| showSectionTitles | _bool_   | `true`        | Toggle the section title elements                        |
| category          | _enum_   | `"all"`       | Set the default category. Use the `Categories` class     |
| columns           | _number_ | `6`           | Number of columns accross                                |
| placeholder       | _string_ | `"Search..."` | A string placeholder when there is no text in text input |
| shouldInclude     | _func_   |               | Function called to check for emoji inclusion             |

## Contributors

Special thanks to everyone who has contributed to this project!

[![Victor K Varghese](https://avatars3.githubusercontent.com/u/15869386?s=80&v=4)](https://github.com/victorkvarghese)
[![Kubo](https://avatars3.githubusercontent.com/u/22464192?s=80&v=4)](https://github.com/ma96o)
[![Mateo Silguero](https://avatars3.githubusercontent.com/u/25598400?s=80&v=4)](https://github.com/mateosilguero)
[![Anastasiia Kravchenko](https://avatars3.githubusercontent.com/u/4223266?s=80&v=4)](https://github.com/St1ma)
[![Sindre](https://avatars3.githubusercontent.com/u/4065840?s=80&v=4)](https://github.com/sseppola)
[![Lucas Feijo](https://avatars3.githubusercontent.com/u/4157166?s=80&v=4)](https://github.com/lucasfeijo)
