        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010$\n\u0002\b\u0004\u0018\u00002\u00020\u0001B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005¢\u0006\u0002\u0010\u0007R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0005X\u0082\u0004¢\u0006\u0002\n\u0000R\u001a\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0005\u0012\u0004\u0012\u00020\u00050\tX\u0082\u0004¢\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\n\u001a\u00020\u00058VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u000b\u0010\f¨\u0006\r"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices$Schedules;", "Lcom/ultron/player/data/remote/ApiType;", "deviceId", "", "startDate", "", "endDate", "(ILjava/lang/String;Ljava/lang/String;)V", "queryParams", "", ImagesContract.URL, "getUrl", "()Ljava/lang/String;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class Schedules extends ApiType {
            private final int deviceId;
            private final String endDate;
            private final Map<String, String> queryParams;
            private final String startDate;

            /* JADX WARN: 'super' call moved to the top of the method (can break code semantics) */
            public Schedules(int i, String startDate, String endDate) {
                super(null);
                Intrinsics.checkNotNullParameter(startDate, "startDate");
                Intrinsics.checkNotNullParameter(endDate, "endDate");
                this.deviceId = i;
                this.startDate = startDate;
                this.endDate = endDate;
                this.queryParams = MapsKt.mapOf(TuplesKt.to("startDate", startDate), TuplesKt.to("endDate", endDate));
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/devices/" + this.deviceId + "/schedules" + genQueryStr(this.queryParams);
            }
        }
