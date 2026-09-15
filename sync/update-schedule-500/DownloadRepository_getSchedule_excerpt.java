    public final okhttp3.Response getSchedule(int r3, java.lang.String r4, java.lang.String r5) {
            r2 = this;
            java.lang.String r0 = "startDate"
            kotlin.jvm.internal.Intrinsics.checkNotNullParameter(r4, r0)
            java.lang.String r0 = "endDate"
            kotlin.jvm.internal.Intrinsics.checkNotNullParameter(r5, r0)
            com.ultron.player.data.remote.ApiType$Devices$Schedules r0 = new com.ultron.player.data.remote.ApiType$Devices$Schedules
            r0.<init>(r3, r4, r5)
            com.ultron.player.data.remote.ApiService r3 = r2.getApiService$app_productRelease()
            okhttp3.OkHttpClient r3 = r3.getBaseClient()
            okhttp3.Request$Builder r4 = new okhttp3.Request$Builder
            r4.<init>()
            java.lang.String r5 = r0.getUrl()
            okhttp3.Request$Builder r4 = r4.url(r5)
            com.ultron.player.data.remote.ApiService r5 = r2.getApiService$app_productRelease()
            java.lang.String r5 = r5.getToken()
            java.lang.StringBuilder r0 = new java.lang.StringBuilder
            java.lang.String r1 = "Bearer "
            r0.<init>(r1)
            r0.append(r5)
            java.lang.String r5 = r0.toString()
            java.lang.String r0 = "Authorization"
            okhttp3.Request$Builder r4 = r4.addHeader(r0, r5)
            okhttp3.Request r4 = r4.build()
            okhttp3.Call r3 = r3.newCall(r4)
            okhttp3.Response r3 = r3.execute()
            return r3
    }
