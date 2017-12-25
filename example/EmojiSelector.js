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
} from 'react-native';
import emoji from 'emoji-datasource';
import 'string.fromcodepoint';

export const Categories = {
    all: {
        symbol: null,
        name: 'All'
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

const EmojiCell = ({ emoji, colSize, ...other }) => (
    <TouchableOpacity
        activeOpacity={0.5}
        style={{
            width: colSize,
            height: colSize,
            alignItems: 'center',
            justifyContent: 'center'
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
                onPress={() => this.props.onEmojiSelect(e)}
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

export default class EmojiSelector extends Component {
    state = {
        searchQuery: '',
        category: Categories.people
    }

    //
    //  HANDLER METHODS
    //
    handleTabSelect = (category) => {
        this.scrollview.scrollTo({x: 0, y: 0, animated: false})
        this.setState({ 
            searchQuery: '',
            category
        })
    }
    handleEmojiSelect = (emoji) => {
        this.props.onEmojiSelect(charFromEmojiObject(emoji));
    }

    //
    //  RENDER METHODS
    //
    renderTabs() {
        return Object.keys(Categories).map(c => {
            if (c !== 'all') return (
                <TouchableOpacity 
                    key={Categories[c].name}
                    onPress={() => this.handleTabSelect(Categories[c])}
                    style={{
                        flex: 1,
                        borderColor: Categories[c] === this.state.category ? this.props.theme : '#EEEEEE',
                        borderBottomWidth: 2
                    }}
                >
                    <Text style={{
                        textAlign: 'center',
                        paddingBottom: 8,
                        fontSize: (width / Object.keys(Categories).length) - 24
                    }}>
                        {Categories[c].symbol}
                    </Text>
                </TouchableOpacity>
            )
        });
    }
    renderEmojis = () => {
        if (this.state.category === Categories.all && this.state.searchQuery === '') {
            return Object.keys(Categories).map(c => {
                if (c !== 'all') return (
                    <EmojiSection
                        key={c}
                        title={Categories[c].name}
                        list={sortEmoji(emojiByCategory(Categories[c].name))}
                        colSize={Math.floor(width / this.props.columns)}
                        onEmojiSelect={this.handleEmojiSelect}
                        onLoadComplete={() => {}}
                    />
                )                   
            });
        } else {
            let list;
            let hasSearchQuery = this.state.searchQuery !== '';
            if (hasSearchQuery)
                list = emoji.filter(e => {
                    // TODO: Use the short_names array instead of singular short_name
                    return e.short_name.includes(this.state.searchQuery.toLowerCase())
                });
            else 
                list = emojiByCategory(this.state.category.name);
            
            return (
                <EmojiSection
                    list={sortEmoji(list)}
                    title={hasSearchQuery ? 'Search results' : this.state.category.name}
                    colSize={Math.floor(width / this.props.columns)}
                    onEmojiSelect={this.handleEmojiSelect}
                    onLoadComplete={() => {}}
                />
            );
        }
    }

    //
    //  LIFECYCLE METHODS
    //
    componentDidMount() {
        const { category } = this.props;
        this.setState({
            category
        });
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.category !== nextState.category || this.state.searchQuery !== nextState.searchQuery)
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
                    <ScrollView 
                        style={styles.scrollview}
                        renderToHardwareTextureAndroid
                        keyboardShouldPersistTaps
                        contentContainerStyle={styles.scrollview_content}
                        ref={scrollview => this.scrollview = scrollview}
                    >
                        <View style={{flex: 1}}>
                            {this.renderEmojis()}
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    }
};

EmojiSelector.propTypes = {
    /** Function called when a user selects an Emoji */
    onEmojiSelect: PropTypes.func.isRequired,

    /** Theme color used for loaders and active tab indicator */
    theme: PropTypes.string,

    /** Toggle the tabs on or off */
    showTabs: PropTypes.bool,

    /** Toggle the searchbar on or off */
    showSearchBar: PropTypes.bool,

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
    columns: 6,
}

const styles = StyleSheet.create({
    frame: {
        flex: 1,
        width: '100%',
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