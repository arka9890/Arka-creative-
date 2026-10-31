# ProGuard rules for Android AI Video Agent
# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /opt/android-sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.kts.

# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep the NativeLib JNI facade
-keep class com.example.aiagent.NativeLib { *; }

# Keep JNI entry points
-keepclasseswithmembers class * {
    native <methods>;
}
