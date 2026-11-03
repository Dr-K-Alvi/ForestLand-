# JS bridge methods are looked up by reflection from the WebView.
-keepclassmembers class com.forestland.focus.WebBridge { @android.webkit.JavascriptInterface <methods>; }
