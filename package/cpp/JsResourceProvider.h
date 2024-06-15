#pragma once

#include <jsi/jsi.h>
#include <modules/skresources/include/SkResources.h>

#include "JsiSkImage.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "modules/skottie/include/Skottie.h"

#pragma clang diagnostic pop

namespace RNSkia {
using namespace facebook;

class JsImageAsset : public skresources::ImageAsset {
public:
  explicit JsImageAsset(std::shared_ptr<jsi::Object> jsObject, jsi::Runtime* runtime) : _jsObject(jsObject), _jsRuntime(runtime) {}
  bool isMultiFrame() override {
    return _jsObject->getProperty(*_jsRuntime, "isMultiFrame").asObject(*_jsRuntime).asFunction(*_jsRuntime).call(*_jsRuntime).asBool();
  }

  FrameData getFrameData(float t) override {
    auto jsFrameData =
        _jsObject->getProperty(*_jsRuntime, "getFrameData").asObject(*_jsRuntime).asFunction(*_jsRuntime).call(*_jsRuntime, jsi::Value(t));

    if (jsFrameData.isNull() || jsFrameData.isUndefined()) {
      return {
          nullptr,
          SkSamplingOptions(SkFilterMode::kLinear, SkMipmapMode::kNearest),
          SkMatrix::I(),
          SizeFit::kNone,
      };
    }
    auto jsFrameDataObject = jsFrameData.asObject(*_jsRuntime);

    auto image = JsiSkImage::fromValue(*_jsRuntime, jsFrameDataObject.getProperty(*_jsRuntime, "image"));
    auto filterMode = (SkFilterMode)jsFrameDataObject.getProperty(*_jsRuntime, "filterMode").asNumber();
    auto mipMapMode = (SkMipmapMode)jsFrameDataObject.getProperty(*_jsRuntime, "mipMapMode").asNumber();
    auto matrix = JsiSkMatrix::fromValue(*_jsRuntime, jsFrameDataObject.getProperty(*_jsRuntime, "matrix"));
    auto sizeFit = (SizeFit)jsFrameDataObject.getProperty(*_jsRuntime, "sizeFit").asNumber();

    return {image, SkSamplingOptions(filterMode, mipMapMode), *matrix, sizeFit};
  }

private:
  std::shared_ptr<jsi::Object> _jsObject;
  jsi::Runtime* _jsRuntime;
};

class JsResourceProvider : public skresources::ResourceProvider {
public:
  static sk_sp<JsResourceProvider> Make(std::shared_ptr<jsi::Object> jsObject, jsi::Runtime* runtime) {
    auto provider = sk_sp<JsResourceProvider>(new JsResourceProvider(jsObject, runtime));
    provider->ref();
    return provider;
  }

  sk_sp<skresources::ImageAsset> loadImageAsset(const char* resourcePath, const char* resourceName, const char* resourceId) const override {
    auto loadImageAsset = _jsObject->getProperty(*_jsRuntime, "loadImageAsset").asObject(*_jsRuntime).asFunction(*_jsRuntime);

    auto jsImageAsset =
        loadImageAsset.call(*_jsRuntime, jsi::String::createFromUtf8(*_jsRuntime, resourcePath),
                            jsi::String::createFromUtf8(*_jsRuntime, resourceName), jsi::String::createFromUtf8(*_jsRuntime, resourceId));

    if (jsImageAsset.isNull() || jsImageAsset.isUndefined()) {
      return nullptr;
    }
    auto imageAsset = sk_sp(new JsImageAsset(std::make_shared<jsi::Object>(jsImageAsset.asObject(*_jsRuntime)), _jsRuntime));
    imageAsset->ref();

    return std::move(imageAsset);
  }

private:
  explicit JsResourceProvider(std::shared_ptr<jsi::Object> jsObject, jsi::Runtime* runtime)
      : skresources::ResourceProvider(), _jsObject(jsObject), _jsRuntime(runtime) {}

  std::shared_ptr<jsi::Object> _jsObject;
  jsi::Runtime* _jsRuntime;
};

} // namespace RNSkia

// Copy/pasted from https://github.com/google/skia/blob/5101cbe5a6bb6f5b05c3f582202f6745f9abe58e/modules/skresources/src/SkResources.cpp
// libskresource is not compiled by react-native-skia, and it was not worth is for this few lines of code
namespace skresources {

sk_sp<SkImage> ImageAsset::getFrame(float t) {
  return nullptr;
}

ImageAsset::FrameData ImageAsset::getFrameData(float t) {
  // legacy behavior
  return {
      this->getFrame(t),
      SkSamplingOptions(SkFilterMode::kLinear, SkMipmapMode::kNearest),
      SkMatrix::I(),
      SizeFit::kCenter,
  };
}
} // namespace skresources
