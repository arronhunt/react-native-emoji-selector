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

const TabCell = ({onPress, active, theme, size, symbol}) => (
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

class EmojiSection extends Component {
    renderCells() {
        return this.props.list.map((e, i) => (
            <EmojiCell 
                key={i}
                emoji={e}
                onPress={() => this.props.onEmojiSelected(e)}
                colSize={this.props.colSize}
            />
        ));
    }
    componentDidMount() {
        this.props.onLoadComplete();
    }
    shouldComponentUpdate(nextProps) {
        if (this.props.list !== nextProps.list) {
            return true;
        };
        return false;
    }
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.sectionHeader}>{this.props.title}</Text>
                {this.renderCells()}
            </View>
        )
    }
}

const storage_key = '@react-native-emoji-selector:HISTORY';
export default class EmojiSelector extends Component {
    state = {
        searchQuery: '',
        category: Categories.people,
        isReady: false,
        history: [],
        emojiList: null,
    }

    //
    //  HANDLER METHODS
    //
    handleTabSelect = (category) => {
        this.scrollview.scrollTo({x: 0, y: 0, animated: false})
        this.setState({ 
            searchQuery: '',
            category,
        });       
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
                let json = JSON.parse(result);

                if (json.filter(r => r.unified === e.unified).length > 0)  {
                    value = json;
                } else {
                    let record = Object.assign({}, e, { count: 1 });
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
    renderTabs() {
        let categories = Object.assign({}, Categories);
        if (!this.props.showHistory)
            delete categories.history;
        return Object.keys(categories).map(c => {
            const tabSize = width / Object.keys(categories).length;
            if (c !== 'all') return (
                <TouchableOpacity 
                    key={categories[c].name}
                    onPress={() => this.handleTabSelect(categories[c])}
                    style={{
                        flex: 1,
                        height: tabSize,
                        borderColor: categories[c] === this.state.category ? this.props.theme : '#EEEEEE',
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
                        {categories[c].symbol}
                    </Text>
                </TouchableOpacity>
            )
        });
    }
    renderEmojis = () => {
        let categories = Object.assign({}, Categories);
        if (!this.props.showHistory)
            delete categories.history;
        if (this.state.category === categories.all && this.state.searchQuery === '') {
            return Object.keys(categories).map(c => {
                let name = categories[c].name;
                if (c !== 'all') return (
                    <EmojiSection
                        key={c}
                        title={name}
                        list={name === 'Recently used' ? this.state.history : this.state.emojiList[name]}
                        colSize={Math.floor(width / this.props.columns)}
                        onEmojiSelected={this.handleEmojiSelect}
                        onLoadComplete={() => {}}
                    />
                )                   
            });
        } else {
            let list;
            let hasSearchQuery = this.state.searchQuery !== '';
            let name = this.state.category.name;
            if (hasSearchQuery) {
                let filtered = emoji.filter(e => {
                    // TODO: Use the short_names array instead of singular short_name
                    return e.short_name.includes(this.state.searchQuery.toLowerCase())
                });
                list = sortEmoji(filtered);
            } else {
                list = this.state.emojiList[name];
            }
            return (
                <EmojiSection
                    list={name === 'Recently used' ? this.state.history : list}
                    title={hasSearchQuery ? 'Search results' : name}
                    colSize={Math.floor(width / this.props.columns)}
                    onEmojiSelected={this.handleEmojiSelect}
                    onLoadComplete={() => {}}
                />
            );
        }
    }

    prerenderEmojis(cb) {
        let emojiList = {};
        Object.keys(Categories).forEach(c => {
            let name = Categories[c].name;
            emojiList[name] = sortEmoji(emojiByCategory(name));
        });
        this.setState({ emojiList }, cb);
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
    shouldComponentUpdate(nextProps, nextState) {
        if (
            this.state.category !== nextState.category || 
            this.state.searchQuery !== nextState.searchQuery ||
            this.state.history !== nextState.history ||
            this.state.emojiList !== nextState.emojiList
        )
            return true;
        return false;
    }
    
    render() {
        const {
            ...other
        } = this.props;
        const Searchbar = (
            <View style={styles.searchbar_container}>
                <TextInput
                    style={styles.search}
                    placeholder='Search...'
                    clearButtonMode='always'
                    returnKeyType='done'
                    autoCorrect={false}
                    underlineColorAndroid={this.props.theme}
                    value={this.state.searchQuery}
                    onChangeText={text => this.setState({ searchQuery: text })}
                />
            </View>
        );

            return (
                <View style={styles.frame} {...other}>
                    <View style={styles.tabBar}>
                        {this.props.showTabs && this.renderTabs()}
                    </View>
                    <View style={{flex: 1}}>
                        {this.props.showSearchBar && Searchbar}
                        {this.state.isReady ? (
                             <ScrollView 
                                style={styles.scrollview}
                                renderToHardwareTextureAndroid
                                keyboardShouldPersistTaps='always'
                                contentContainerStyle={styles.scrollview_content}
                                ref={scrollview => this.scrollview = scrollview}
                            >
                                <View style={{flex: 1}}>
                                    {this.state.emojiList && this.renderEmojis()}
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={styles.loader} {...other}>
                                <ActivityIndicator size={0} />
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
    theme: PropTypes.string,

    /** Toggle the tabs on or off */
    showTabs: PropTypes.bool,

    /** Toggle the searchbar on or off */
    showSearchBar: PropTypes.bool,

    /** Toggle the history section on or off */
    showHistory: PropTypes.bool,

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
    columns: 6,
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
        flex: 1
    },
    scrollview_content: {
        paddingTop: 36 + 16 // Searchbar height + margin
    },
    searchbar_container: {
        position: 'absolute',
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
        marginTop: 24,
        fontSize: 17,
        width: '100%',
        color: '#8F8F8F'
    }
});