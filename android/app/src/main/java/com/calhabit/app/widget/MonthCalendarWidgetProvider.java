package com.calhabit.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.calhabit.app.MainActivity;
import com.calhabit.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * TimeTree 스타일 4x4 / 4x5 월간 캘린더 위젯 Provider
 */
public class MonthCalendarWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_PREV_MONTH = "com.calhabit.app.widget.ACTION_PREV_MONTH";
    public static final String ACTION_NEXT_MONTH = "com.calhabit.app.widget.ACTION_NEXT_MONTH";
    public static final String ACTION_REFRESH = "com.calhabit.app.widget.ACTION_REFRESH";
    public static final String ACTION_WIDGET_DATA_CHANGED = "com.calhabit.app.ACTION_WIDGET_DATA_CHANGED";

    private static final String PREFS_NAME = "CalHabitWidgetPrefs";
    private static final String CAPACITOR_PREFS = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (action == null) return;

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        if (ACTION_PREV_MONTH.equals(action)) {
            int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                changeMonth(widgetPrefs, appWidgetId, -1);
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        } else if (ACTION_NEXT_MONTH.equals(action)) {
            int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                changeMonth(widgetPrefs, appWidgetId, 1);
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        } else if (ACTION_REFRESH.equals(action) || ACTION_WIDGET_DATA_CHANGED.equals(action)) {
            int[] allIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, MonthCalendarWidgetProvider.class));
            for (int id : allIds) {
                updateAppWidget(context, appWidgetManager, id);
            }
        }
    }

    private static void changeMonth(SharedPreferences prefs, int appWidgetId, int delta) {
        Calendar now = Calendar.getInstance();
        int year = prefs.getInt("year_" + appWidgetId, now.get(Calendar.YEAR));
        int month = prefs.getInt("month_" + appWidgetId, now.get(Calendar.MONTH) + 1);

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.YEAR, year);
        cal.set(Calendar.MONTH, month - 1);
        cal.set(Calendar.DAY_OF_MONTH, 1);
        cal.add(Calendar.MONTH, delta);

        prefs.edit()
            .putInt("year_" + appWidgetId, cal.get(Calendar.YEAR))
            .putInt("month_" + appWidgetId, cal.get(Calendar.MONTH) + 1)
            .apply();
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences widgetPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences capPrefs = context.getSharedPreferences(CAPACITOR_PREFS, Context.MODE_PRIVATE);

        Calendar now = Calendar.getInstance();
        int currentYear = now.get(Calendar.YEAR);
        int currentMonth = now.get(Calendar.MONTH) + 1;

        int dispYear = widgetPrefs.getInt("year_" + appWidgetId, currentYear);
        int dispMonth = widgetPrefs.getInt("month_" + appWidgetId, currentMonth);

        String theme = widgetPrefs.getString("theme_" + appWidgetId, "light");
        int opacity = widgetPrefs.getInt("opacity_" + appWidgetId, 95); // 0 ~ 100

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_month_calendar);

        // 1. 테마 및 배경 투명도 라운드 카드 렌더링
        boolean isDark = "dark".equalsIgnoreCase(theme);
        int alpha = Math.max(0, Math.min(255, (int) (opacity * 2.55f)));
        int bgColor = isDark ? Color.argb(alpha, 24, 24, 27) : Color.argb(alpha, 255, 255, 255);
        int titleColor = isDark ? Color.parseColor("#F4F4F5") : Color.parseColor("#18181B");
        int subColor = isDark ? Color.parseColor("#A1A1AA") : Color.parseColor("#71717A");
        int defaultDayColor = isDark ? Color.parseColor("#E4E4E7") : Color.parseColor("#27272A");
        int otherMonthDayColor = isDark ? Color.parseColor("#52525B") : Color.parseColor("#A1A1AA");

        views.setImageViewBitmap(R.id.widget_bg, createRoundedCardBitmap(bgColor, 32f));
        views.setTextColor(R.id.tv_month_title, titleColor);
        views.setTextColor(R.id.tv_month_subtitle, subColor);
        views.setTextViewText(R.id.tv_month_title, dispYear + "년 " + dispMonth + "월");

        // 2. 컨트롤 버튼 PendingIntent 바인딩
        // 이전 달 (<)
        Intent prevIntent = new Intent(context, MonthCalendarWidgetProvider.class);
        prevIntent.setAction(ACTION_PREV_MONTH);
        prevIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent piPrev = PendingIntent.getBroadcast(context, 1000 + appWidgetId, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_prev_month, piPrev);

        // 다음 달 (>)
        Intent nextIntent = new Intent(context, MonthCalendarWidgetProvider.class);
        nextIntent.setAction(ACTION_NEXT_MONTH);
        nextIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent piNext = PendingIntent.getBroadcast(context, 2000 + appWidgetId, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_next_month, piNext);

        // 일정 추가 (+) - 앱 실행 및 모달 딥링크
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.setAction(Intent.ACTION_VIEW);
        addIntent.setData(Uri.parse("calhabit://add"));
        addIntent.putExtra("action", "add_event");
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent piAdd = PendingIntent.getActivity(context, 3000 + appWidgetId, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_add_event, piAdd);

        // 새로고침 (🔄)
        Intent refreshIntent = new Intent(context, MonthCalendarWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH);
        refreshIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent piRefresh = PendingIntent.getBroadcast(context, 4000 + appWidgetId, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_refresh, piRefresh);

        // 위젯 설정 (⚙)
        Intent configIntent = new Intent(context, WidgetConfigureActivity.class);
        configIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        configIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent piConfig = PendingIntent.getActivity(context, 5000 + appWidgetId, configIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.btn_settings, piConfig);

        // 헤더 텍스트 터치 시 현재 달로 복귀 및 앱 실행
        Intent headerIntent = new Intent(context, MainActivity.class);
        headerIntent.setAction(Intent.ACTION_VIEW);
        headerIntent.setData(Uri.parse("calhabit://today"));
        PendingIntent piHeader = PendingIntent.getActivity(context, 6000 + appWidgetId, headerIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.header_title_container, piHeader);

        // 3. 저장된 전체 일정 데이터 로드 & 날짜별 맵핑
        Map<String, List<WidgetEventItem>> eventsByDate = loadEventsMap(capPrefs);

        // 4. 6주 x 7일 달력 날짜 매트릭스 계산 및 렌더링
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA);
        String todayStr = sdf.format(now.getTime());

        Calendar cal = Calendar.getInstance(Locale.KOREA);
        cal.set(Calendar.YEAR, dispYear);
        cal.set(Calendar.MONTH, dispMonth - 1);
        cal.set(Calendar.DAY_OF_MONTH, 1);

        // 1일의 요일 (1=일, 2=월, ..., 7=토)
        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        cal.add(Calendar.DAY_OF_MONTH, -(firstDayOfWeek - 1));

        int cellRequestCode = 7000 + (appWidgetId * 50);

        for (int r = 0; r < 6; r++) {
            for (int c = 0; c < 7; c++) {
                int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);
                int month = cal.get(Calendar.MONTH) + 1;
                boolean isCurMonth = (month == dispMonth);
                String cellDateStr = sdf.format(cal.getTime());
                boolean isToday = cellDateStr.equals(todayStr);

                int cellId = context.getResources().getIdentifier("cell_" + r + "_" + c, "id", context.getPackageName());
                int dayId = context.getResources().getIdentifier("day_" + r + "_" + c, "id", context.getPackageName());
                int chip1Id = context.getResources().getIdentifier("chip1_" + r + "_" + c, "id", context.getPackageName());
                int chip2Id = context.getResources().getIdentifier("chip2_" + r + "_" + c, "id", context.getPackageName());
                int chip3Id = context.getResources().getIdentifier("chip3_" + r + "_" + c, "id", context.getPackageName());
                int moreId = context.getResources().getIdentifier("more_" + r + "_" + c, "id", context.getPackageName());

                if (cellId == 0 || dayId == 0) continue;

                // 날짜 숫자 표시
                views.setTextViewText(dayId, String.valueOf(dayOfMonth));

                // 오늘 뱃지 또는 요일별 색상 처리
                if (isToday) {
                    views.setInt(dayId, "setBackgroundResource", R.drawable.widget_today_circle);
                    views.setTextColor(dayId, Color.WHITE);
                } else {
                    views.setInt(dayId, "setBackgroundResource", 0);
                    if (!isCurMonth) {
                        views.setTextColor(dayId, otherMonthDayColor);
                    } else if (c == 0) {
                        views.setTextColor(dayId, Color.parseColor("#E53935")); // 일요일 빨강
                    } else if (c == 6) {
                        views.setTextColor(dayId, Color.parseColor("#1E88E5")); // 토요일 파랑
                    } else {
                        views.setTextColor(dayId, defaultDayColor);
                    }
                }

                // 해당 날짜 일정 칩 렌더링
                List<WidgetEventItem> dayEvents = eventsByDate.get(cellDateStr);
                int eventCount = (dayEvents != null) ? dayEvents.size() : 0;

                // Chip 1
                if (eventCount > 0) {
                    WidgetEventItem ev = dayEvents.get(0);
                    views.setViewVisibility(chip1Id, View.VISIBLE);
                    views.setTextViewText(chip1Id, ev.title);
                    views.setInt(chip1Id, "setBackgroundResource", getChipDrawableForColor(ev.colorHex));
                } else {
                    views.setViewVisibility(chip1Id, View.GONE);
                }

                // Chip 2
                if (eventCount > 1) {
                    WidgetEventItem ev = dayEvents.get(1);
                    views.setViewVisibility(chip2Id, View.VISIBLE);
                    views.setTextViewText(chip2Id, ev.title);
                    views.setInt(chip2Id, "setBackgroundResource", getChipDrawableForColor(ev.colorHex));
                } else {
                    views.setViewVisibility(chip2Id, View.GONE);
                }

                // Chip 3
                if (eventCount > 2) {
                    WidgetEventItem ev = dayEvents.get(2);
                    views.setViewVisibility(chip3Id, View.VISIBLE);
                    views.setTextViewText(chip3Id, ev.title);
                    views.setInt(chip3Id, "setBackgroundResource", getChipDrawableForColor(ev.colorHex));
                } else {
                    views.setViewVisibility(chip3Id, View.GONE);
                }

                // More Indicator (+N)
                if (eventCount > 3) {
                    views.setViewVisibility(moreId, View.VISIBLE);
                    views.setTextViewText(moreId, "+" + (eventCount - 3));
                } else {
                    views.setViewVisibility(moreId, View.GONE);
                }

                // 날짜 셀 클릭 딥링크 (특정 날짜로 앱 실행)
                Intent dateIntent = new Intent(context, MainActivity.class);
                dateIntent.setAction(Intent.ACTION_VIEW);
                dateIntent.setData(Uri.parse("calhabit://date/" + cellDateStr));
                dateIntent.putExtra("target_date", cellDateStr);
                dateIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent piCell = PendingIntent.getActivity(context, cellRequestCode++, dateIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                views.setOnClickPendingIntent(cellId, piCell);

                cal.add(Calendar.DAY_OF_MONTH, 1);
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static Map<String, List<WidgetEventItem>> loadEventsMap(SharedPreferences capPrefs) {
        Map<String, List<WidgetEventItem>> map = new HashMap<>();
        String json = capPrefs.getString("calhabit_monthly_widget_events", null);
        if (json == null) return map;

        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String date = obj.optString("date", "");
                String title = obj.optString("title", "");
                String colorHex = obj.optString("colorHex", "#5B84B1");
                boolean isCompleted = obj.optBoolean("isCompleted", false);

                if (!date.isEmpty() && !title.isEmpty()) {
                    List<WidgetEventItem> list = map.computeIfAbsent(date, k -> new ArrayList<>());
                    list.add(new WidgetEventItem(title, colorHex, isCompleted));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }

    private static Bitmap createRoundedCardBitmap(int color, float radiusPx) {
        int w = 240;
        int h = 240;
        Bitmap bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(color);
        RectF rect = new RectF(0, 0, w, h);
        canvas.drawRoundRect(rect, radiusPx, radiusPx, paint);
        return bitmap;
    }

    public static int getChipDrawableForColor(String hex) {
        if (hex == null) return R.drawable.widget_chip_color_0;
        hex = hex.toUpperCase().trim();
        if (hex.contains("5B84B1") || hex.contains("3B82F6") || hex.contains("2563EB")) return R.drawable.widget_chip_color_0; // Navy / Blue
        if (hex.contains("43A047") || hex.contains("10B981") || hex.contains("16A34A") || hex.contains("22C55E")) return R.drawable.widget_chip_color_1; // Emerald
        if (hex.contains("00ACC1") || hex.contains("06B6D4") || hex.contains("0284C7")) return R.drawable.widget_chip_color_2; // Cyan
        if (hex.contains("FB8C00") || hex.contains("F59E0B") || hex.contains("FBBF24") || hex.contains("DDB165")) return R.drawable.widget_chip_color_3; // Amber / Gold
        if (hex.contains("E53935") || hex.contains("EF4444") || hex.contains("DC2626") || hex.contains("F87171")) return R.drawable.widget_chip_color_4; // Coral / Red
        if (hex.contains("8E24AA") || hex.contains("A855F7") || hex.contains("9333EA")) return R.drawable.widget_chip_color_5; // Purple
        if (hex.contains("D81B60") || hex.contains("EC4899") || hex.contains("DB2777")) return R.drawable.widget_chip_color_6; // Pink
        if (hex.contains("00897B") || hex.contains("14B8A6") || hex.contains("0D9488")) return R.drawable.widget_chip_color_7; // Teal
        if (hex.contains("424242") || hex.contains("71717A") || hex.contains("52525B") || hex.contains("27272A") || hex.contains("18181B")) return R.drawable.widget_chip_color_8; // Dark gray
        if (hex.contains("3949AB") || hex.contains("6366F1") || hex.contains("4F46E5")) return R.drawable.widget_chip_color_9; // Indigo
        return R.drawable.widget_chip_color_0;
    }

    private static class WidgetEventItem {
        String title;
        String colorHex;
        boolean isCompleted;

        WidgetEventItem(String title, String colorHex, boolean isCompleted) {
            this.title = title;
            this.colorHex = colorHex;
            this.isCompleted = isCompleted;
        }
    }
}
