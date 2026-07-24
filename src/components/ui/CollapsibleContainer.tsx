import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type Props = {
  title: string;
  iconTitle?: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function CollapsibleContainer({
  title,
  children,
  iconTitle,
  defaultCollapsed = true,
  collapsed: collapsedProp,
  onCollapsedChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isControlled = collapsedProp !== undefined;
  const isCollapsed = isControlled ? collapsedProp : collapsed;

  const handleToggle = () => {
    const nextValue = !isCollapsed;
    if (isControlled) {
      onCollapsedChange?.(nextValue);
      return;
    }
    setCollapsed(nextValue);
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().overshootClamping(1)}
      style={styles.container}
    >
      <Pressable
        style={styles.header}
        onPress={handleToggle}
      >
        <View style={styles.titleContainer}>
            {isCollapsed && iconTitle && (
            <MaterialIcons
                name={iconTitle}
                size={20}
                color={Colors.primary}
                style={{ marginRight: 8 }}
            />
            )}

            {isCollapsed && (
            <Text style={styles.title}>
                {title}
            </Text>
            )}
        </View>

        <MaterialIcons
            name={isCollapsed ? 'expand-more' : 'expand-less'}
            size={24}
            color="#333"
        />
        </Pressable>

      {!isCollapsed && (
        <Animated.View
          layout={LinearTransition.springify().damping(18)}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(140)}
          style={styles.content}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    },
  header: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
