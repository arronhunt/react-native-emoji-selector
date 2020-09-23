import React, { Component } from "react";
import GestureRecognizer, {
  swipeDirections,
} from "react-native-swipe-gestures";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  AsyncStorage,
  FlatList,
} from "react-native";

import emoji from "./emojiDataSource.json";

export const Categories = {
  history: {
    symbol: "🕘",
    name: "Recently used",
    key: "history",
  },
  emotion: {
    symbol: "😀",
    name: "Smileys & Emotion",
    key: "emotion",
  },
  people: {
    symbol: "🧑",
    name: "People & Body",
    key: "people",
  },
  nature: {
    symbol: "🦄",
    name: "Animals & Nature",
    key: "nature",
  },
  food: {
    symbol: "🍔",
    name: "Food & Drink",
    key: "food",
  },
  activities: {
    symbol: "⚾️",
    name: "Activities",
    key: "activities",
  },
  places: {
    symbol: "✈️",
    name: "Travel & Places",
    key: "places",
  },
  objects: {
    symbol: "💡",
    name: "Objects",
    key: "objects",
  },
  symbols: {
    symbol: "🔣",
    name: "Symbols",
    key: "symbols",
  },
  flags: {
    symbol: "🏳️‍🌈",
    name: "Flags",
    key: "flags",
  },
};

const storage_key = "@react-native-emoji-selector:HISTORY";

const filteredEmojis = emoji.filter((e) => !e["obsoleted_by"]);
const emojiByCategory = (category) =>
  filteredEmojis.filter((e) => e.category === category);
const sortEmoji = (list) => list.sort((a, b) => a.sort_order - b.sort_order);
const categoryKeys = Object.keys(Categories);

const TabBar = ({
  theme,
  activeCategory,
  onPress,
  width,
  categoryEmojiSize,
}) => {
  const tabSize = width / categoryKeys.length;

  return categoryKeys.map((c) => {
    const category = Categories[c];
    return (
      <TouchableOpacity
        key={category.name}
        onPress={() => onPress(category)}
        style={{
          flex: 1,
          height: tabSize,
          borderColor: category === activeCategory ? theme : "#EEEEEE",
          borderBottomWidth: 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            paddingBottom: 8,
            fontSize: categoryEmojiSize || tabSize - 24,
          }}
        >
          {category.symbol}
        </Text>
      </TouchableOpacity>
    );
  });
};

const EmojiCell = ({ emoji, colSize, emojiSize, ...other }) => (
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
    <Text style={{ color: "#FFFFFF", fontSize: emojiSize || colSize - 12 }}>
      {emoji.unified}
    </Text>
  </TouchableOpacity>
);

export default class EmojiSelector extends Component {
  emojiList = {};

  state = {
    searchQuery: "",
    category: Categories.people,
    isReady: false,
    history: [],
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
    if (this.props.showHistory) {
      this.addToHistoryAsync(emoji);
    }
    this.props.onEmojiSelected(emoji.unified);
  };

  handleSearch = (searchQuery) => {
    this.setState({ searchQuery });
  };

  addToHistoryAsync = async (emoji) => {
    let history = await AsyncStorage.getItem(storage_key);

    let value = [];
    if (!history) {
      // no history
      let record = Object.assign({}, emoji, { count: 1 });
      value.push(record);
    } else {
      let json = JSON.parse(history);
      if (json.filter((r) => r.unified === emoji.unified).length > 0) {
        value = json;
      } else {
        let record = Object.assign({}, emoji, { count: 1 });
        value = [record, ...json];
      }
    }

    AsyncStorage.setItem(storage_key, JSON.stringify(value));
    this.setState({
      history: value,
    });
  };

  loadHistoryAsync = async () => {
    let result = await AsyncStorage.getItem(storage_key);
    if (result) {
      let history = JSON.parse(result);
      this.setState({ history });
    }
  };

  //
  //  RENDER METHODS
  //
  renderEmojiCell = ({ item, index }) => (
    <EmojiCell
      key={index}
      emoji={item}
      onPress={() => this.handleEmojiSelect(item)}
      colSize={this.state.colSize}
      emojiSize={this.props.emojiSize}
    />
  );

  returnSectionData() {
    const { history, searchQuery, category } = this.state;

    let emojiData = (() => {
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
        list = this.emojiList[name];
      }
      return list;
    })();

    return this.props.shouldInclude
      ? emojiData.filter((e) => this.props.shouldInclude(e.emoji))
      : emojiData;
  }

  prerenderEmojis(callback) {
    this.setState(
      {
        colSize: Math.floor(this.state.width / this.props.columns),
      },
      callback
    );
  }

  handleLayout = ({ nativeEvent: { layout } }) => {
    this.setState({ width: layout.width }, () => {
      this.prerenderEmojis(() => {
        this.setState({ isReady: true });
      });
    });
  };

  //
  //  LIFECYCLE METHODS
  //
  componentDidMount() {
    const { category, showHistory } = this.props;
    this.setState({ category });

    categoryKeys.forEach((c) => {
      let name = Categories[c].name;
      this.emojiList[name] = sortEmoji(emojiByCategory(name));
    });

    if (showHistory) {
      this.loadHistoryAsync();
    }
  }

  handleEmojiContainerSwipe = (gestureName) => {
    const currentCategoryIndex = categoryKeys.findIndex(
      (value) => value === this.state.category.key
    );

    switch (gestureName) {
      case swipeDirections.SWIPE_RIGHT: {
        if (currentCategoryIndex - 1 >= 0) {
          this.setState(
            {
              category: Categories[categoryKeys[currentCategoryIndex - 1]],
            },
            () => {
              this.scrollview?.scrollToOffset({ x: 0, y: 0, animated: false });
            }
          );
        }
        break;
      }
      case swipeDirections.SWIPE_LEFT: {
        if (currentCategoryIndex + 1 < categoryKeys.length) {
          this.setState(
            {
              category: Categories[categoryKeys[currentCategoryIndex + 1]],
            },
            () => {
              this.scrollview?.scrollToOffset({
                x: 0,
                y: 0,
                animated: false,
              });
            }
          );
        }
        break;
      }
    }
  };

  render() {
    const {
      theme,
      columns,
      placeholder,
      showHistory,
      showSearchBar,
      showSectionTitles,
      showTabs,
      categoryEmojiSize,
      ...other
    } = this.props;

    const { category, colSize, isReady, searchQuery, isSwiped } = this.state;

    const Searchbar = (
      <View style={styles.searchbar_container}>
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          clearButtonMode="always"
          returnKeyType="done"
          autoCorrect={false}
          underlineColorAndroid={theme}
          value={searchQuery}
          onChangeText={this.handleSearch}
        />
      </View>
    );

    const title = searchQuery !== "" ? "Search Results" : category.name;

    return (
      <View style={{ flex: 1 }}>
        <GestureRecognizer
          onSwipe={this.handleEmojiContainerSwipe}
          style={{ flex: 1 }}
          config={{
            velocityThreshold: 0.2,
            gestureIsClickThreshold: 3,
          }}
        >
          <View style={styles.frame} {...other} onLayout={this.handleLayout}>
            <View style={{ flex: 1 }}>
              <View style={styles.tabBar}>
                {showTabs && (
                  <TabBar
                    activeCategory={category}
                    onPress={this.handleTabSelect}
                    theme={theme}
                    width={this.state.width}
                    categoryEmojiSize={categoryEmojiSize}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {showSearchBar && Searchbar}
                {isReady ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.container}>
                      {showSectionTitles && (
                        <Text style={styles.sectionHeader}>{title}</Text>
                      )}
                      <FlatList
                        scrollEnabled={!isSwiped}
                        style={styles.scrollview}
                        contentContainerStyle={{ paddingBottom: colSize }}
                        data={this.returnSectionData()}
                        renderItem={this.renderEmojiCell}
                        horizontal={false}
                        numColumns={columns}
                        keyboardShouldPersistTaps={"always"}
                        ref={(scrollview) => (this.scrollview = scrollview)}
                        removeClippedSubviews
                        keyExtractor={(item) => item.unified}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.loader} {...other}>
                    <ActivityIndicator size={"large"} color={theme} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </GestureRecognizer>
        {this.props.renderActionContainer()}
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
