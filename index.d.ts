declare module 'react-native-emoji-selector' {
  export enum EmojiCategory {
    All = ".all",
    History = ".history",
    People = ".people",
    Nature = ".nature",
    Food = ".food",
    Activities = ".activities",
    Places = ".places",
    Objects = ".objects",
    Symbols = ".symbols",
    Flags = ".flags",
  }
  export interface EmojiSelectorProps {
    onEmojiSelected(emoji: string): void,
    theme?: string,
    showTabs?: boolean,
    showSearchBar?: boolean,
    showHistory?: boolean,
    category?: EmojiCategory,
    columns?: number
  }
}