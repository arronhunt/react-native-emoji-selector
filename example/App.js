import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  PlatformColor,
} from "react-native";

import EmojiSelector, { Categories, defaultStyles } from "./module";
const THEME = PlatformColor("systemFill");

export default App = () => {
  const [emoji, setEmoji] = React.useState(null);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Please select the emoji you would like to use
      </Text>
      <View style={styles.display}>
        <Text style={{ fontSize: 64, backgroundColor: "transparent" }}>
          {emoji}
        </Text>
      </View>
      <EmojiSelector
        onEmojiSelected={setEmoji}
        showSearchBar={true}
        showTabs={true}
        showHistory={true}
        showSectionTitles={true}
        category={Categories.people}
        overrideStyles={{
          frame: {
            ...defaultStyles.frame,
          },
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PlatformColor("systemBackground"),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: PlatformColor("label"),
  },
  display: {
    width: 96,
    height: 96,
    margin: 24,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: THEME,
    alignItems: "center",
    justifyContent: "center",
  },
});
