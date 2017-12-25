import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

import EmojiSelector, { Categories } from './EmojiSelector';

export default class App extends React.Component {
  state = {
    emoji: ' '
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Please select the emoji you would like to use</Text>
        <Text style={styles.display}>{this.state.emoji}</Text>
        <EmojiSelector 
          onEmojiSelect={emoji => this.setState({emoji})}
          showSearchBar={true}
          showTabs={true}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  display: {
    fontSize: 64,
    margin: 24
  }
});
