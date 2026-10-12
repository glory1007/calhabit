package com.calhabit.app.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.SeekBar;
import android.widget.TextView;

import com.calhabit.app.R;

/**
 * 위젯 추가 및 재설정 액티비티 (라이트/다크 테마, 배경 투명도 0%~100% 실시간 조절)
 */
public class WidgetConfigureActivity extends Activity {

    private static final String PREFS_NAME = "CalHabitWidgetPrefs";
    private int mAppWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    private LinearLayout previewCard;
    private TextView previewMonthTitle;
    private RadioGroup rgTheme;
    private RadioButton rbLight;
    private RadioButton rbDark;
    private TextView tvOpacityValue;
    private SeekBar sbOpacity;
    private Button btnCancel;
    private Button btnApply;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);

        Intent intent = getIntent();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            mAppWidgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (mAppWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        setContentView(R.layout.activity_widget_configure);

        previewCard = findViewById(R.id.preview_card);
        previewMonthTitle = findViewById(R.id.preview_month_title);
        rgTheme = findViewById(R.id.rg_theme);
        rbLight = findViewById(R.id.rb_theme_light);
        rbDark = findViewById(R.id.rb_theme_dark);
        tvOpacityValue = findViewById(R.id.tv_opacity_value);
        sbOpacity = findViewById(R.id.sb_opacity);
        btnCancel = findViewById(R.id.btn_cancel);
        btnApply = findViewById(R.id.btn_apply);

        // 기존 저장된 설정값 불러오기
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String savedTheme = prefs.getString("theme_" + mAppWidgetId, "light");
        int savedOpacity = prefs.getInt("opacity_" + mAppWidgetId, 95);

        if ("dark".equalsIgnoreCase(savedTheme)) {
            rbDark.setChecked(true);
        } else {
            rbLight.setChecked(true);
        }

        sbOpacity.setProgress(savedOpacity);
        tvOpacityValue.setText(savedOpacity + "%");
        updatePreview(savedTheme, savedOpacity);

        // 테마 라디오 버튼 변경 리스너
        rgTheme.setOnCheckedChangeListener((group, checkedId) -> {
            String currentTheme = (checkedId == R.id.rb_theme_dark) ? "dark" : "light";
            updatePreview(currentTheme, sbOpacity.getProgress());
        });

        // 투명도 슬라이더 리스너
        sbOpacity.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                tvOpacityValue.setText(progress + "%");
                String currentTheme = rbDark.isChecked() ? "dark" : "light";
                updatePreview(currentTheme, progress);
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        // 취소 버튼
        btnCancel.setOnClickListener(v -> finish());

        // 적용 / 완료 버튼
        btnApply.setOnClickListener(v -> {
            String selectedTheme = rbDark.isChecked() ? "dark" : "light";
            int selectedOpacity = sbOpacity.getProgress();

            // 설정 저장
            prefs.edit()
                .putString("theme_" + mAppWidgetId, selectedTheme)
                .putInt("opacity_" + mAppWidgetId, selectedOpacity)
                .apply();

            // 위젯 갱신
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(WidgetConfigureActivity.this);
            MonthCalendarWidgetProvider.updateAppWidget(WidgetConfigureActivity.this, appWidgetManager, mAppWidgetId);

            // 성공 반환
            Intent resultValue = new Intent();
            resultValue.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, mAppWidgetId);
            setResult(RESULT_OK, resultValue);
            finish();
        });
    }

    private void updatePreview(String theme, int opacity) {
        boolean isDark = "dark".equalsIgnoreCase(theme);
        int alpha = Math.max(0, Math.min(255, (int) (opacity * 2.55f)));
        int bgColor = isDark ? Color.argb(alpha, 24, 24, 27) : Color.argb(alpha, 255, 255, 255);
        int titleColor = isDark ? Color.parseColor("#F4F4F5") : Color.parseColor("#18181B");

        GradientDrawable bgDrawable = new GradientDrawable();
        bgDrawable.setColor(bgColor);
        bgDrawable.setCornerRadius(dpToPx(16));
        previewCard.setBackground(bgDrawable);

        previewMonthTitle.setTextColor(titleColor);
    }

    private float dpToPx(int dp) {
        return dp * getResources().getDisplayMetrics().density;
    }
}
