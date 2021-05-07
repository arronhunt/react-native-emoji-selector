import React from "react";
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
  PlatformColor,
  Appearance,
  useColorScheme,
} from "react-native";
import emoji_datasource from "emoji-datasource";

const colorScheme = Appearance.getColorScheme();

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

const charFromUtf16 = (utf16) =>
  String.fromCodePoint(...utf16.split("-").map((u) => "0x" + u));
export const charFromEmojiObject = (obj) => charFromUtf16(obj.unified);
const filteredEmojis = emoji_datasource.filter((e) => !e["obsoleted_by"]);
const emojiByCategory = (category) =>
  filteredEmojis.filter((e) => e.category === category);
const sortEmoji = (list) => list.sort((a, b) => a.sort_order - b.sort_order);
const categoryKeys = Object.keys(Categories);

const TabBar = ({ theme, activeCategory, onPress, width }) => {
  const tabSize = width / categoryKeys.length;
  const colorScheme = useColorScheme();

  return categoryKeys.map((c) => {
    const category = Categories[c];
    if (c !== "all")
      return (
        <TouchableOpacity
          key={category.name}
          onPress={() => onPress(category)}
          activeOpacity={0.5}
          style={[
            defaultStyles.tab,
            {
              height: tabSize,
              borderColor:
                category === activeCategory
                  ? theme
                  : colorScheme === "light"
                  ? PlatformColor("systemGray5")
                  : PlatformColor("systemGray4") /*TODO: Android */,
            },
          ]}
        >
          <Text
            style={{
              textAlign: "center",
              paddingBottom: 8,
              fontSize: tabSize - 24,
            }}
          >
            {category.symbol}
          </Text>
        </TouchableOpacity>
      );
  });
};

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
const EmojiSelector = ({
  theme,
  category,
  columns,
  placeholder,
  showHistory,
  showSearchBar,
  showSectionTitles,
  showTabs,
  onEmojiSelected,
  shouldInclude,
  overrideStyles = {},
  ...other
}) => {
  let [state, setState] = React.useState({
    searchQuery: "",
    category: category ?? Categories.people,
    isReady: false,
    history: [],
    emojiList: null,
    colSize: 0,
    width: 0,
  });

  const scrollviewRef = React.useRef(null);
  const styles = {
    ...defaultStyles,
    ...overrideStyles,
  };

  const handleLayout = ({ nativeEvent: { layout } }) => {
    if (layout.width !== state.width) {
      setState({
        ...state,
        width: layout.width,
      });
    }
  };

  const handleTabSelect = (category) => {
    if (state.isReady) {
      scrollviewRef.current?.scrollToOffset({ x: 0, y: 0, animated: false });
      setState({
        ...state,
        searchQuery: "",
        category,
      });
    }
  };

  const returnSectionData = () => {
    const { history, emojiList, searchQuery, category } = state;
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
          const filtered = emoji_datasource.filter((e) => {
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
    return shouldInclude
      ? emojiData.filter((e) => shouldInclude(e.emoji))
      : emojiData;
  };

  const prerenderEmojis = () => {
    let emojiList = {};
    categoryKeys.forEach((c) => {
      let name = Categories[c].name;
      emojiList[name] = sortEmoji(emojiByCategory(name));
    });

    setState({
      ...state,
      emojiList,
      colSize: Math.floor(state.width / columns),
      isReady: true,
    });
  };

  const handleEmojiSelect = (emoji) => {
    // TODO: Figure out history bullshit
    // if (showHistory) {
    //   addToHistoryAsync(emoji);
    // }
    onEmojiSelected(charFromEmojiObject(emoji));
  };

  const renderEmojiCell = ({ item }) => (
    <EmojiCell
      key={item.key}
      emoji={item.emoji}
      onPress={() => handleEmojiSelect(item.emoji)}
      colSize={state.colSize}
    />
  );

  const handleSearch = (searchQuery) => {
    setState({ ...state, searchQuery });
  };

  React.useEffect(() => {
    if (state.width > 0) {
      prerenderEmojis();
    }
  }, [state.width]);

  return (
    <View style={styles.frame} {...other} onLayout={handleLayout}>
      <View style={styles.tabBar}>
        {showTabs && (
          <TabBar
            activeCategory={state.category}
            onPress={handleTabSelect}
            theme={theme}
            width={state.width}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {showSearchBar && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.search}
              placeholder={placeholder}
              clearButtonMode="always"
              returnKeyType="done"
              autoCorrect={false}
              underlineColorAndroid={theme}
              value={state.searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        )}
        {state.isReady ? (
          <View style={{ flex: 1 }}>
            <View style={styles.container}>
              {showSectionTitles && (
                <Text style={styles.sectionHeader}>
                  {state.searchQuery !== ""
                    ? "Search Results"
                    : state.category.name}
                </Text>
              )}
              <FlatList
                style={styles.scrollview}
                contentContainerStyle={{ paddingBottom: state.colSize }}
                data={returnSectionData()}
                renderItem={renderEmojiCell}
                horizontal={false}
                numColumns={columns}
                keyboardShouldPersistTaps={"always"}
                ref={scrollviewRef}
                removeClippedSubviews
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
};

EmojiSelector.defaultProps = {
  theme: PlatformColor("link") /* TODO: Android */,
  category: Categories.all,
  showTabs: true,
  showSearchBar: true,
  showHistory: false,
  showSectionTitles: true,
  columns: 6,
  placeholder: "Search...",
};

export const defaultStyles = StyleSheet.create({
  frame: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: PlatformColor("systemBackground") /*TODO: Android */,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tab: {
    flex: 1,
    borderBottomWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
  },
  scrollview: {
    flex: 1,
  },
  searchContainer: {
    width: "100%",
    zIndex: 1,
  },
  search: {
    ...Platform.select({
      ios: {
        height: 36,
        paddingLeft: 8,
        borderRadius: 10,
        color: PlatformColor("label") /* TODO: Android */,
        backgroundColor: PlatformColor("systemGray6") /* TODO: Android */,
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
    color: PlatformColor("secondaryLabel") /* TODO: Android */,
  },
});

export default EmojiSelector;
