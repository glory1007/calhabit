package com.calhabit.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.calhabit.app.widget.MonthCalendarWidgetProvider;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private String pendingTargetDate = null;
    private boolean pendingQuickAdd = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        injectBridge();
        dispatchPendingActions();
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        String targetDate = intent.getStringExtra("target_date");
        String action = intent.getStringExtra("action");

        if (targetDate != null) {
            pendingTargetDate = targetDate;
        } else if (uri != null && uri.toString().contains("calhabit://date/")) {
            pendingTargetDate = uri.toString().replace("calhabit://date/", "");
        }

        if ("add_event".equals(action) || (uri != null && uri.toString().contains("calhabit://add"))) {
            pendingQuickAdd = true;
        }

        dispatchPendingActions();
    }

    private void dispatchPendingActions() {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        WebView webView = getBridge().getWebView();
        webView.postDelayed(() -> {
            if (pendingTargetDate != null) {
                String js = "window.handleCalHabitDateNavigation && window.handleCalHabitDateNavigation('" + pendingTargetDate + "');";
                webView.evaluateJavascript(js, null);
                pendingTargetDate = null;
            }

            if (pendingQuickAdd) {
                String js = "window.handleCalHabitQuickAdd && window.handleCalHabitQuickAdd();";
                webView.evaluateJavascript(js, null);
                pendingQuickAdd = false;
            }
        }, 300);
    }

    private void injectBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        WebView webView = getBridge().getWebView();
        webView.post(() -> {
            webView.addJavascriptInterface(new NativeWidgetBridge(), "CalHabitNativeBridge");
        });
    }

    public class NativeWidgetBridge {
        @JavascriptInterface
        public void notifyWidgetUpdate() {
            Intent updateIntent = new Intent(MainActivity.this, MonthCalendarWidgetProvider.class);
            updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            AppWidgetManager manager = AppWidgetManager.getInstance(MainActivity.this);
            int[] ids = manager.getAppWidgetIds(new ComponentName(MainActivity.this, MonthCalendarWidgetProvider.class));
            updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            sendBroadcast(updateIntent);
        }
    }
}
