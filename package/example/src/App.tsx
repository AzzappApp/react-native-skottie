import * as React from 'react';
import {
  Text,
  View,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import {
  Skottie,
  AnimationObject,
  SkottieAPI,
  SizeFit,
  type SkSkottie,
  type SkottieViewRef,
  type ImageAsset,
  type ResourceProvider,
} from 'react-native-skottie';
import {
  Skia,
  FilterMode,
  MipmapMode,
  drawAsImageFromPicture,
  createPicture,
  Canvas,
  Picture,
} from '@shopify/react-native-skia';
import * as Animations from './animations';
import LottieView from 'lottie-react-native';
import DotLottieAnimation from './animations/Hands.lottie';
import { useEffect, useMemo, useState } from 'react';
import {
  Easing,
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  runOnUI,
} from 'react-native-reanimated';

const animations = {
  ...Animations,
  DotLottieAnimation,
};

const ExternalResources = require('./animations/ExternalResources.json');

function SkottieAnimation({ source }: { source: AnimationObject }) {
  const [loop, setIsLoop] = useState(true);

  return (
    <View style={styles.flex1}>
      <Skottie
        resizeMode="contain"
        style={styles.flex1}
        source={source}
        autoPlay={true}
        loop={loop}
        onAnimationFinish={(isCancelled) => {
          console.log('onAnimationFinish', { isCancelled });
        }}
      />
      <View style={styles.switchOption}>
        <Switch value={loop} onValueChange={() => setIsLoop((p) => !p)} />
        <Text>Looping</Text>
      </View>
    </View>
  );
}

function LottieAnimation({ source }: { source: AnimationObject }) {
  return (
    <LottieView
      resizeMode="contain"
      style={styles.flex1}
      source={source}
      autoPlay={true}
      loop={true}
    />
  );
}

function SkottieImperativeAPI({ source }: { source: AnimationObject }) {
  const skottieRef = React.useRef<SkottieViewRef>(null);

  return (
    <View style={styles.flex1}>
      <Button
        title="Play"
        onPress={() => {
          skottieRef.current?.play();
        }}
      />
      <Button
        title="Pause"
        onPress={() => {
          skottieRef.current?.pause();
        }}
      />
      <Button
        title="Reset"
        onPress={() => {
          skottieRef.current?.reset();
        }}
      />
      <Skottie
        ref={skottieRef}
        resizeMode="contain"
        style={styles.flex1}
        source={source}
        loop={true}
      />
    </View>
  );
}

function LottieImperativeAPI({ source }: { source: AnimationObject }) {
  const lottieRef = React.useRef<LottieView>(null);

  return (
    <View style={styles.flex1}>
      <Button
        title="Play"
        onPress={() => {
          lottieRef.current?.play();
        }}
      />
      <Button
        title="Pause"
        onPress={() => {
          lottieRef.current?.pause();
        }}
      />
      <Button
        title="Resume"
        onPress={() => {
          lottieRef.current?.resume();
        }}
      />
      <Button
        title="Reset"
        onPress={() => {
          lottieRef.current?.reset();
        }}
      />
      <LottieView
        ref={lottieRef}
        resizeMode="contain"
        style={styles.flex1}
        source={source}
        loop={true}
        autoPlay={false}
      />
    </View>
  );
}

function SkottiePropsAPI({ source }: { source: AnimationObject }) {
  const [loop, setLoop] = React.useState(true);
  const [autoPlay, setAutoPlay] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [_progress, setProgress] = React.useState(0);

  return (
    <View style={styles.flex1}>
      <Button
        title="Play"
        onPress={() => {
          setAutoPlay(true);
        }}
      />
      <Button
        title="Pause"
        onPress={() => {
          setAutoPlay(false);
        }}
      />
      <Button
        title="Reset"
        onPress={() => {
          setProgress(0);
        }}
      />
      <Button
        title={`Toggle loop (its ${loop ? 'on' : 'off'})`}
        onPress={() => {
          setLoop((p) => !p);
        }}
      />
      <Button
        title="Speed +1"
        onPress={() => {
          setSpeed((p) => p + 1);
        }}
      />
      <Skottie
        resizeMode="contain"
        style={styles.flex1}
        source={source}
        loop={loop}
        autoPlay={autoPlay}
        speed={speed}
        // TODO: that wouldn't work at the minute, and the imperative API should be used!
        // progress={progress}
        onAnimationFinish={() => {
          console.log('onAnimationFinish');
        }}
      />
    </View>
  );
}

function SkottieProgressAPI({ source }: { source: AnimationObject }) {
  // Create animation manually
  const animation = useMemo(() => SkottieAPI.createFrom(source), [source]);
  const progress = useSharedValue(0);

  useEffect(() => {
    // Run the animation using reanimated
    progress.value = withRepeat(
      withTiming(1, {
        duration: animation.duration * 1000,
        easing: Easing.linear,
      }),
      -1
    );
  }, [animation.duration, progress]);

  return (
    <View style={styles.flex1}>
      <Text style={styles.heading}>Progress controlled example</Text>
      <Skottie source={animation} progress={progress} style={styles.flex1} />
    </View>
  );
}

function SkottieExternalResource() {
  const animationSharedValue = useSharedValue<SkSkottie | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      const imageAssets: Record<string, ImageAsset> = {};
      let duration = 0;
      const innerAnimations = Object.values(Animations).map((animation) =>
        SkottieAPI.createFrom(animation)
      );
      let currentAnimation = 0;
      const resourceProvider: ResourceProvider = {
        loadImageAsset: (_resourcePath, _resourceName, resourceId) => {
          let imageAsset = imageAssets[resourceId];
          if (imageAsset == null) {
            const innerAnimation =
              innerAnimations[currentAnimation++ % innerAnimations.length]!;
            imageAsset = {
              isMultiFrame() {
                return true;
              },
              getFrameData(time) {
                const progress = time / duration;
                innerAnimation.seek(progress);
                return {
                  image: drawAsImageFromPicture(
                    createPicture((canvas) => {
                      innerAnimation.seek(progress);
                      innerAnimation.render(canvas, {
                        x: 0,
                        y: 0,
                        width: 500,
                        height: 500,
                      });
                    }),
                    { width: 500, height: 500 }
                  ),
                  filterMode: FilterMode.Nearest,
                  mipMapMode: MipmapMode.None,
                  sizeFit: SizeFit.Center,
                  matrix: Skia.Matrix(),
                };
              },
            };
            imageAssets[resourceId] = imageAsset;
          }
          return imageAsset;
        },
      };
      const animation = SkottieAPI.createFrom(
        ExternalResources,
        resourceProvider
      );
      duration = animation.duration;
      animationSharedValue.value = animation;

      progress.value = withRepeat(
        withTiming(1, {
          duration: animation.duration * 1000,
          easing: Easing.linear,
        }),
        -1
      );
    })();
  }, [progress, animationSharedValue]);

  const size = useSharedValue({ width: 0, height: 0 });

  const picture = useDerivedValue(() => {
    const animation = animationSharedValue.value;
    return createPicture((canvas) => {
      if (!animation) {
        return;
      }
      animation.seek(progress.value);
      animation.render(canvas, {
        x: 0,
        y: 0,
        ...size.value,
      });
    });
  });

  return (
    <View style={styles.flex1}>
      <Text style={styles.heading}>Progress controlled example</Text>
      <Canvas style={styles.flex1} onSize={size}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

type ExampleType =
  | 'default'
  | 'imperative'
  | 'props-controlled'
  | 'progress-controlled';

function ExampleTypeSwitches({
  exampleType,
  setExampleType,
}: {
  exampleType: ExampleType;
  setExampleType: (type: ExampleType) => void;
}) {
  return (
    <View>
      <View style={styles.switchOption}>
        <Switch
          value={exampleType === 'default'}
          onValueChange={() => setExampleType('default')}
        />
        <Text>None</Text>
      </View>
      <View style={styles.switchOption}>
        <Switch
          value={exampleType === 'imperative'}
          onValueChange={() => setExampleType('imperative')}
        />
        <Text>Imperative API</Text>
      </View>
      <View style={styles.switchOption}>
        <Switch
          value={exampleType === 'props-controlled'}
          onValueChange={() => setExampleType('props-controlled')}
        />
        <Text>Props controlled</Text>
      </View>
      <View style={styles.switchOption}>
        <Switch
          value={exampleType === 'progress-controlled'}
          onValueChange={() => setExampleType('progress-controlled')}
        />
        <Text>Progress controlled</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [type, setType] = React.useState<'skottie' | 'lottie'>('skottie');
  const [exampleType, setExampleType] = React.useState<ExampleType>('default');
  const [animation, setAnimation] = React.useState<
    AnimationObject | undefined
  >();
  const [external, setExternal] = React.useState(false);

  const animationContent = useMemo(() => {
    if (external) {
      return <SkottieExternalResource />;
    }
    if (animation == null) return null;

    if (type === 'skottie') {
      switch (exampleType) {
        case 'default':
          return <SkottieAnimation source={animation} />;
        case 'imperative':
          return <SkottieImperativeAPI source={animation} />;
        case 'props-controlled':
          return <SkottiePropsAPI source={animation} />;
        case 'progress-controlled':
          return <SkottieProgressAPI source={animation} />;
      }
    }
    if (type === 'lottie') {
      switch (exampleType) {
        case 'default':
          return <LottieAnimation source={animation} />;
        case 'imperative':
          return <LottieImperativeAPI source={animation} />;
        case 'props-controlled':
          return <LottieAnimation source={animation} />;
        case 'progress-controlled':
          return <LottieAnimation source={animation} />;
      }
    }

    throw new Error('Invalid type');
  }, [animation, exampleType, type, external]);

  return (
    <SafeAreaView style={styles.flex1}>
      {animation == null && !external ? (
        <ScrollView style={styles.flex1}>
          <Text style={styles.heading}>Example type</Text>
          <ExampleTypeSwitches
            exampleType={exampleType}
            setExampleType={setExampleType}
          />

          <Text style={styles.heading}>Skottie</Text>
          {Object.keys(animations).map((key) => (
            <View key={`skottie-${key}`}>
              <Button
                title={key}
                onPress={() => {
                  setType('skottie');
                  // @ts-expect-error Animations not having right type
                  setAnimation(animations[key]);
                }}
              />
            </View>
          ))}
          <Button
            title="External resources"
            onPress={() => {
              setExternal(true);
            }}
          />
          <Text style={styles.heading}>Lottie</Text>
          {Object.keys(animations).map((key) => (
            <View key={`lottie-${key}`}>
              <Button
                title={key}
                onPress={() => {
                  setType('lottie');
                  // @ts-expect-error Animations not having right type
                  setAnimation(animations[key]);
                }}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.flex1}>
          {animationContent}
          <Button
            title="Back"
            onPress={() => {
              setAnimation(undefined);
              setExternal(false);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: 'white',
  },
  heading: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
