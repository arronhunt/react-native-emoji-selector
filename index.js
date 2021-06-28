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
  Modal,
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

const TabBar = ({ theme, activeCategory, onPress, width, styles }) => {
  const categories = Object.keys(Categories);
  const tabSize = Math.min(width / categories.length, 56);
  const colorScheme = useColorScheme();

  return categories.map((c) => {
    const category = Categories[c];
    if (c !== "all")
      return (
        <TouchableOpacity
          key={category.name}
          onPress={() => onPress(category)}
          activeOpacity={0.5}
          style={[
            {
              height: tabSize,
              borderColor:
                category === activeCategory
                  ? theme
                  : colorScheme === "light"
                  ? PlatformColor("systemGray5")
                  : PlatformColor("systemGray4") /*TODO: Android */,
            },
            styles.tab,
          ]}
        >
          <Text style={[{ fontSize: tabSize - 24 }, styles.tabInner]}>
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

// TODO: Move all these styles to defaultStyles and allow for overrides
const VariationPicker = ({ emoji, onEmojiSelected, ...props }) => {
  const renderEmojis = () => {
    let { skin_variations } = emoji;
    let variants = Object.keys(skin_variations).map(
      (skin) => skin_variations[skin]
    );

    return (
      <View
        style={{
          backgroundColor: PlatformColor("secondarySystemBackground"),
          width: 240,
          height: 176,
          padding: 24,
          borderRadius: 24,
        }}
      >
        <FlatList
          data={[].concat(emoji, variants)}
          renderItem={({ item }) => (
            <EmojiCell
              key={item.key}
              emoji={item}
              colSize={64}
              onPress={() => onEmojiSelected(item)}
            />
          )}
          keyExtractor={(item) => item.unified}
          horizontal={false}
          numColumns={3}
        />
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      style={{
        flex: 1,
      }}
      {...props}
    >
      <View
        style={{
          flex: 1,
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {emoji ? renderEmojis() : "..."}
      </View>
    </Modal>
  );
};

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
  let [selectedEmoji, setSelectedEmoji] = React.useState(null);
  let [showVariations, setShowVariations] = React.useState(false);

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
    if (showVariations) {
      setShowVariations(false);
    }
  };
  const handleEmojiLongPress = (emoji) => {
    if (emoji.skin_variations) {
      setSelectedEmoji(emoji);
      setShowVariations(true);
    } else {
      handleEmojiSelect(emoji);
    }
  };

  const renderEmojiCell = ({ item }) => (
    <EmojiCell
      key={item.key}
      emoji={item.emoji}
      onPress={() => handleEmojiSelect(item.emoji)}
      onLongPress={() => handleEmojiLongPress(item.emoji)}
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
      <VariationPicker
        emoji={selectedEmoji}
        visible={showVariations}
        onEmojiSelected={handleEmojiSelect}
        onRequestClose={() => setShowVariations(false)}
      />
      <View style={styles.tabBar}>
        {showTabs && (
          <TabBar
            activeCategory={state.category}
            onPress={handleTabSelect}
            theme={theme}
            styles={styles}
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
  tabInner: {
    textAlign: "center",
    paddingBottom: 8,
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
