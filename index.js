import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import emoji from "emoji-datasource";

import MMKVStorage from "react-native-mmkv-storage";
import { FlashList } from "@shopify/flash-list";
export const Categories = {
  all: {
    symbol: null,
    name: "All",
  },
  history: {
    symbol: "🕘",
    name: "Recently used",
  },
  emotion: {
    symbol: "😀",
    name: "Smileys & Emotion",
  },
  people: {
    symbol: "🧑",
    name: "People & Body",
  },
  nature: {
    symbol: "🦄",
    name: "Animals & Nature",
  },
  food: {
    symbol: "🍔",
    name: "Food & Drink",
  },
  activities: {
    symbol: "⚾️",
    name: "Activities",
  },
  places: {
    symbol: "✈️",
    name: "Travel & Places",
  },
  objects: {
    symbol: "💡",
    name: "Objects",
  },
  symbols: {
    symbol: "🔣",
    name: "Symbols",
  },
  flags: {
    symbol: "🏳️‍🌈",
    name: "Flags",
  },
};
const storage = new MMKVStorage.Loader().initialize();

const charFromUtf16 = (utf16) => {
  if (!utf16) {
    return "";
  }
  return String.fromCodePoint(...utf16.split("-").map((u) => "0x" + u));
};
export const charFromEmojiObject = (obj) => charFromUtf16(obj.unified);
const filteredEmojis = emoji.filter((e) => !e["obsoleted_by"]);
const emojiByCategory = (category) =>
  filteredEmojis.filter((e) => e.category === category);
const sortEmoji = (list) => list.sort((a, b) => a.sort_order - b.sort_order);
const categoryKeys = Object.keys(Categories);

const EmojiCell = ({ emoji, colSize, ...other }) => (
  <TouchableOpacity
    activeOpacity={0.5}
    style={{
      width: colSize,
      height: colSize,
      alignItems: "center",
      justifyContent: "center",
    }}
    {...other}
  >
    <Text style={{ color: "#FFFFFF", fontSize: colSize - 12 }}>
      {charFromEmojiObject(emoji)}
    </Text>
  </TouchableOpacity>
);

const storage_key = "@react-native-emoji-selector:HISTORY";
export default class EmojiSelector extends Component {
  state = {
    searchQuery: "",
    category: Categories.people,
    isReady: false,
    history: [],
    emojis: [],
    emojiList: null,
    colSize: 0,
    width: 0,
  };

  //
  //  HANDLER METHODS
  //
  handleTabSelect = (category) => {
    if (this.state.isReady) {
      if (this.scrollview)
        this.scrollview.scrollToOffset({ x: 0, y: 0, animated: false });
      this.setState({
        searchQuery: "",
        category,
      });
    }
  };

  handleEmojiSelect = (emoji) => {
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  handleSearch = (searchQuery) => {
    this.setState({ searchQuery });
  };

  addToHistoryAsync = async (emoji) => {
    const emojiArray = Array.from(emoji).map((item) => ({
      key: item.codePointAt(0).toString(16).toUpperCase(),
    }));

    const newArrayEmojis = this.state.emojis.filter((emojiObj) =>
      emojiArray.some((arrObj) => arrObj.key === emojiObj.key)
    );

    let history = await storage.getItem(storage_key);

    let value = [];
    if (history) {
      const json = JSON.parse(history);

      const mergedArray = [];
      let newIndex = 0;

      while (newIndex < newArrayEmojis.length && mergedArray.length < 8) {
        const newEmoji = newArrayEmojis[newIndex];
        const existingIndex = json.findIndex(
          (jsonEmoji) => jsonEmoji.key === newEmoji.key
        );

        if (existingIndex !== -1) {
          mergedArray.push(json[existingIndex]);
          json.splice(existingIndex, 1);
        } else {
          const existingValueIndex = value.findIndex(
            (valEmoji) => valEmoji.key === newEmoji.key
          );
          if (existingValueIndex === -1) {
            mergedArray.push(newEmoji);
          }
        }
        newIndex++;
      }

      const remainingSpaces = 8 - mergedArray.length;
      const additionalValues = json.slice(0, remainingSpaces);
      mergedArray.push(...additionalValues);
      value = mergedArray;
    } else {
      value = [...value, ...newArrayEmojis.slice(0, 8)];
    }

    storage.setItem(storage_key, JSON.stringify(value));
    this.setState({
      history: value,
    });
  };

  loadHistoryAsync = async () => {
    let result = await storage.getItem(storage_key);
    if (result) {
      let history = JSON.parse(result);
      this.setState({ history });
    }
  };

  //
  //  RENDER METHODS
  //
  renderEmojiCell = ({ item }) => {
    return (
      <EmojiCell
        key={item.key}
        emoji={item.emoji}
        onPress={() => this.handleEmojiSelect(item.emoji)}
        colSize={this.state.colSize}
      />
    );
  };

  returnSectionData() {
    const { history, emojiList, searchQuery, category } = this.state;

    let emojiData = (function () {
      if (category === Categories.all && searchQuery === "") {
        //TODO: OPTIMIZE THIS
        let largeList = [];
        categoryKeys.forEach((c) => {
          const name = Categories[c].name;
          const list =
            name === Categories.history.name ? history : emojiList[name];
          if (c !== "all" && c !== "history")
            largeList = largeList.concat(list);
        });
        return largeList.map((emoji) => ({ key: emoji.unified, emoji }));
      } else {
        let list;
        const hasSearchQuery = searchQuery !== "";
        const name = category.name;
        if (hasSearchQuery) {
          const filtered = emoji.filter((e) => {
            let display = false;
            e.short_names.forEach((name) => {
              if (name.includes(searchQuery.toLowerCase())) display = true;
            });
            return display;
          });
          list = sortEmoji(filtered);
        } else if (name === Categories.history.name) {
          list = history;
        } else {
          list = emojiList[name];
        }
        return list.map((emoji) => ({ key: emoji.unified, emoji }));
      }
    })();

    this.setState({
      emojis: this.props.shouldInclude
        ? emojiData.filter((e) => this.props.shouldInclude(e.emoji))
        : emojiData,
    });
  }

  prerenderEmojis(callback) {
    let emojiList = {};
    categoryKeys.forEach((c) => {
      let name = Categories[c].name;
      emojiList[name] = sortEmoji(emojiByCategory(name));
    });

    this.setState(
      {
        emojiList,
        colSize: Math.floor(this.state.width / this.props.columns),
      },
      callback
    );
  }

  handleLayout = ({ nativeEvent: { layout } }) => {
    this.setState({ width: layout.width }, () => {
      this.prerenderEmojis(() => {
        this.setState({ isReady: true });
        this.returnSectionData();
      });
    });
  };

  //
  //  LIFECYCLE METHODS
  //
  componentDidMount() {
    const { category, showHistory } = this.props;
    this.setState({ category });

    if (showHistory) {
      this.loadHistoryAsync();
    }
  }

  render() {
    const {
      theme,
      columns,
      placeholder,
      showHistory,
      showSearchBar,
      showSectionTitles,
      showTabs,
      titlesEmoji,
      titlesEmojiHistory,
      ...other
    } = this.props;

    const { colSize, isReady, history, emojis } = this.state;

    const ListHeaderComponent = () => {
      return (
        <View>
          {history?.length ? (
            <>
              <Text style={styles.sectionHeader}>{titlesEmojiHistory}</Text>
              <View style={styles.tabBar}>
                {history.map((item) => {
                  return (
                    <EmojiCell
                      emoji={item.emoji}
                      onPress={() => this.handleEmojiSelect(item.emoji)}
                      colSize={this.state.colSize}
                    />
                  );
                })}
              </View>
            </>
          ) : null}
          {showSectionTitles ? (
            <Text style={styles.sectionHeader}>{titlesEmoji}</Text>
          ) : null}
        </View>
      );
    };

    return (
      <View style={styles.frame} {...other} onLayout={this.handleLayout}>
        <View style={{ flex: 1 }}>
          {isReady ? (
            <View style={{ flex: 1 }}>
              <View style={styles.container}>
                <FlashList
                  style={styles.scrollview}
                  contentContainerStyle={{ paddingBottom: colSize }}
                  data={emojis}
                  renderItem={this.renderEmojiCell}
                  horizontal={false}
                  numColumns={columns}
                  keyboardShouldPersistTaps={"always"}
                  ref={(scrollview) => (this.scrollview = scrollview)}
                  removeClippedSubviews
                  showsVerticalScrollIndicator={false}
                  estimatedItemSize={40}
                  ListHeaderComponent={ListHeaderComponent}
                />
              </View>
            </View>
          ) : (
            <View style={styles.loader} {...other}>
              <ActivityIndicator
                size={"large"}
                color={Platform.OS === "android" ? theme : "#000000"}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
}

EmojiSelector.defaultProps = {
  theme: "#007AFF",
  category: Categories.all,
  showTabs: true,
  showSearchBar: true,
  showHistory: false,
  showSectionTitles: true,
  columns: 6,
  placeholder: "Search...",
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: "100%",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
  },
  scrollview: {
    flex: 1,
  },
  searchbar_container: {
    width: "100%",
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  search: {
    ...Platform.select({
      ios: {
        height: 36,
        paddingLeft: 8,
        borderRadius: 10,
        backgroundColor: "#E5E8E9",
      },
    }),
    margin: 8,
  },
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionHeader: {
    margin: 8,
    fontSize: 17,
    width: "100%",
    color: "#8F8F8F",
  },
});
