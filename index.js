import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput, 
  Platform,
  Dimensions,
  ActivityIndicator,
  AsyncStorage,
  FlatList,
} from 'react-native';
import emoji from 'emoji-datasource';
import 'string.fromcodepoint';

export const Categories = {
  all: {
    symbol: null,
    name: 'All'
  },
  history: {
    symbol: '🕘',
    name: 'Recently used'
  },
  people: {
    symbol: '😊',
    name: 'Smileys & People'
  },
  nature: {
    symbol: '🦄',
    name: 'Animals & Nature',
  },
  food: {
    symbol: '🍔',
    name: 'Food & Drink'
  },
  activities: {
    symbol: '⚾️',
    name: 'Activities'
  },
  places: {
    symbol: '✈️',
    name: 'Travel & Places'
  },
  objects: {
    symbol: '💡',
    name: 'Objects'
  },
  symbols: {
    symbol: '🔣',
    name: 'Symbols'
  },
  flags: {
    symbol: '🏳️‍🌈',
    name: 'Flags'
  }
};

const charFromUtf16 = utf16 => String.fromCodePoint(...utf16.split('-').map(u => '0x' + u));
export const charFromEmojiObject = obj => charFromUtf16(obj.unified);
const emojiByCategory = category => emoji.filter(e => e.category === category);
const sortEmoji = list => list.sort((a, b) => a.sort_order - b.sort_order);
const { width } = Dimensions.get("screen");
const categoryKeys = Object.keys(Categories);

const TabCell = ({ onPress, active, theme, size, symbol }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      flex: 1,
      height: size,
      borderColor: active ? theme : '#EEEEEE',
      borderBottomWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
  <Text style={{
    textAlign: 'center',
    paddingBottom: 8,
    fontSize: size - 24
  }}>
    {symbol}
  </Text>
  </TouchableOpacity>
);

const TabBar = ({ theme, activeCategory, onPress }) => {
  return (
    categoryKeys.map(c => {
      const tabSize = width / categoryKeys.length;
      const category = Categories[c];
      if (c !== 'all') return (
        <TouchableOpacity 
          key={category.name}
          onPress={() => onPress(category)}
          style={{
            flex: 1,
            height: tabSize,
            borderColor: category === activeCategory ? theme : '#EEEEEE',
            borderBottomWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <Text style={{
          textAlign: 'center',
          paddingBottom: 8,
          fontSize: (tabSize) - 24
        }}>
            {category.symbol}
        </Text>
        </TouchableOpacity>
      )
    })
  )
};

const EmojiCell = ({ emoji, colSize, ...other }) => (
  <TouchableOpacity
    activeOpacity={0.5}
    style={{
      width: colSize,
      height: colSize,
      alignItems: 'center',
      justifyContent: 'center',
    }}
    {...other}
  >
  <Text style={{ fontSize: (colSize) - 12 }}>
    {charFromEmojiObject(emoji)}
  </Text>
  </TouchableOpacity>
);

const EmojiSection = ({ title, list, colSize, colCount, onLoadComplete, onEmojiSelected }) => (
  <View style={styles.container}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <FlatList
      style={styles.scrollview}
      contentContainerStyle={{ paddingBottom: colSize }}
      data={list.map(emoji => ({ key: emoji.unified, emoji }))}
      renderItem={({item}) => (
        <EmojiCell 
          key={item.key}
          emoji={item.emoji}
          onPress={() => onEmojiSelected(item.emoji)}
          colSize={colSize}
        />
      )}
      horizontal={false}
      numColumns={colCount}
      keyboardShouldPersistTaps={'always'}
      removeClippedSubviews
    />
  </View>
);

const storage_key = '@react-native-emoji-selector:HISTORY';
export default class EmojiSelector extends Component {
  state = {
    searchQuery: '',
    category: Categories.people,
    isReady: false,
    history: [],
    emojiList: null,
    colSize: 0
  }

  //
  //  HANDLER METHODS
  //
  handleTabSelect = (category) => {
    if (this.state.isReady) {
      if (this.scrollview)
        this.scrollview.scrollToOffset({x: 0, y: 0, animated: false});
      this.setState({ 
        searchQuery: '',
        category,
      });       
    }
  }
  handleEmojiSelect = (emoji) => {
    if (this.props.showHistory) {
      this.addToHistory(emoji);
    }
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  }
  addToHistory = (e) => {
    AsyncStorage.getItem(storage_key).then(result => {
      let value = [];
      if (result) {
        const json = JSON.parse(result);
        if (json.filter(r => r.unified === e.unified).length > 0)  {
          value = json;
        } else {
          const record = Object.assign({}, e, { count: 1 });
          value = [record, ...json];
        }
      }
      AsyncStorage.setItem(storage_key, JSON.stringify(value));
      this.setState({
        history: value
      });
    });
  }
  getHistory = () => {
    AsyncStorage.getItem(storage_key)
    .then(result => JSON.parse(result))
    .then(history => {
      if (history) this.setState({ history });
    });
  }

  //
  //  RENDER METHODS
  //
  returnSectionData() {
    const { 
      colSize,
      history,
      emojiList,
      searchQuery,
      category
    } = this.state;
    if (category === Categories.all && searchQuery === '') {
      //TODO: OPTIMIZE THIS
      let largeList =  [];
      categoryKeys.forEach(c => {
        const name = Categories[c].name;
        const list = name === Categories.history.name ? history : emojiList[name]  
        if (c !== 'all' && c !== 'history') 
          largeList = largeList.concat(list);
      });

      return (largeList.map(emoji => ({ key: emoji.unified, emoji })))

    } else {
        let list;
        const hasSearchQuery = searchQuery !== '';
        const name = category.name;
        if (hasSearchQuery) {
          const filtered = emoji.filter(e => {
            let display = false;
            e.short_names.forEach(name => {
              if(name.includes(searchQuery.toLowerCase())) display = true;
            })
            return display;
          });
          list = sortEmoji(filtered);
        } else if (name === Categories.history.name) {
          list = history
        } else {
          list = emojiList[name];
        }
        return (list.map(emoji => ({ key: emoji.unified, emoji })))
    }
  }

  prerenderEmojis(cb) {
    let emojiList = {};
    categoryKeys.forEach(c => {
      let name = Categories[c].name;
      emojiList[name] = sortEmoji(emojiByCategory(name));
    });
    this.setState({ 
      emojiList, 
      colSize: Math.floor(width / this.props.columns)
    }, cb);
  }

  //
  //  LIFECYCLE METHODS
  //
  componentDidMount() {
    const { category } = this.props;
    this.setState({ category });

    if (this.props.showHistory)
      this.getHistory();
    
    this.prerenderEmojis(() => {
      this.setState({isReady: true})
    });
  }
    
  render() {
    const {
      theme,
      columns,
      showHistory,
      showSearchBar,
      showSectionTitles,
      showTabs,
      ...other
    } = this.props;
    const Searchbar = (
      <View style={styles.searchbar_container}>
        <TextInput
          style={styles.search}
          placeholder={this.props.placeholder}
          clearButtonMode='always'
          returnKeyType='done'
          autoCorrect={false}
          underlineColorAndroid={this.props.theme}
          value={this.state.searchQuery}
          onChangeText={text => this.setState({ searchQuery: text })}
        />
      </View>
    );

    const title = this.state.searchQuery !== '' ? 'Search Results' : this.state.category.name;

    return (
      <View style={styles.frame} {...other}>
        <View style={styles.tabBar}>
          { showTabs && (
            <TabBar 
              activeCategory={this.state.category}
              onPress={this.handleTabSelect}
              theme={theme}
            />
          )}
        </View>
        <View style={{flex: 1}}>
          {showSearchBar && Searchbar}
          {this.state.isReady ? (
            <View style={{flex: 1}}>
              <View style={styles.container}>
                {showSectionTitles && <Text style={styles.sectionHeader}>{title}</Text>}
                <FlatList
                  style={styles.scrollview}
                  contentContainerStyle={{ paddingBottom: this.state.colSize }}
                  data={this.returnSectionData()}
                  renderItem={({item}) => (
                    <EmojiCell 
                      key={item.key}
                      emoji={item.emoji}
                      onPress={() => this.handleEmojiSelect(item.emoji)}
                      colSize={this.state.colSize}
                    />
                  )}
                  horizontal={false}
                  numColumns={columns}
                  keyboardShouldPersistTaps={'always'}
                  ref={scrollview => this.scrollview = scrollview}
                  removeClippedSubviews
                />
              </View>
            </View>
          ) : (
            <View style={styles.loader} {...other}>
              <ActivityIndicator size={'large'} color={Platform.OS === 'android' ? this.props.theme : '#000000'} />
            </View>
          )}
        </View>
      </View>
    );
  }
};

EmojiSelector.propTypes = {
  /** Function called when a user selects an Emoji */
  onEmojiSelected: PropTypes.func.isRequired,

  /** Theme color used for loaders and active tab indicator */
  theme: PropTypes.oneOfType([
      PropTypes.string, // legacy
      PropTypes.object
  ]),
  
  /** Placeholder of search input */
  placeholder: PropTypes.string,

  /** Toggle the tabs on or off */
  showTabs: PropTypes.bool,

  /** Toggle the searchbar on or off */
  showSearchBar: PropTypes.bool,

  /** Toggle the history section on or off */
  showHistory: PropTypes.bool,

  /** Toggle section title on or off */
  showSectionTitles: PropTypes.bool,

  /** Set the default category. Use the `Categories` class */
  category: PropTypes.object,

  /** Number of columns accross */
  columns: PropTypes.number,
}
EmojiSelector.defaultProps = {
  theme: '#007AFF',
  category: Categories.all,
  showTabs: true,
  showSearchBar: true,
  showHistory: false,
  showSectionTitles: true,
  columns: 6,
  placeholder: 'Search...'
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: '100%',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBar: {
    flexDirection: 'row'
  },
  scrollview: {
    flex: 1,
  },
  searchbar_container: {
    width: '100%',
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.75)'
  },
  search: {
    ...Platform.select({
      ios: {
        height: 36,
        paddingLeft: 8,
        borderRadius: 10,
        backgroundColor: '#E5E8E9'
      }
    }),
    margin: 8,
  },
  container: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  sectionHeader: {
    margin: 8,
    fontSize: 17,
    width: '100%',
    color: '#8F8F8F'
  }
});
