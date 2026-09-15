package com.ultron.player.data.remote;

import com.google.android.gms.actions.SearchIntents;
import com.google.android.gms.common.internal.ImagesContract;
import com.ultron.player.data.model.api.request.BindDeviceRequest;
import com.ultron.player.data.model.api.request.LoginRequest;
import com.ultron.player.data.model.api.request.Stats;
import com.ultron.player.data.model.api.request.UpdateDeviceInfo;
import com.ultron.player.data.model.api.request.UpdateDeviceNetInfo;
import com.ultron.player.data.model.api.request.UpdateDeviceScreenShot;
import com.ultron.player.data.model.api.request.UpdateDeviceStats;
import com.ultron.player.data.model.api.request.UpdateInternetTime;
import com.ultron.player.data.model.api.request.UploadMediasRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import kotlin.Metadata;
import kotlin.TuplesKt;
import kotlin.collections.CollectionsKt;
import kotlin.collections.MapsKt;
import kotlin.jvm.internal.DefaultConstructorMarker;
import kotlin.jvm.internal.Intrinsics;

/* compiled from: ApiType.kt */
@Metadata(d1 = {"\u0000B\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010$\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b6\u0018\u0000 \f2\u00020\u0001:\u0005\n\u000b\f\r\u000eB\u0007\b\u0004¢\u0006\u0002\u0010\u0002J\u001c\u0010\u0007\u001a\u00020\u00042\u0012\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0004\u0012\u0004\u0012\u00020\u00010\tH\u0004R\u0014\u0010\u0003\u001a\u00020\u0004X\u0096D¢\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006\u0082\u0001\t\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017¨\u0006\u0018"}, d2 = {"Lcom/ultron/player/data/remote/ApiType;", "", "()V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "genQueryStr", SearchIntents.EXTRA_QUERY, "", "Branches", "Brands", "Companion", "Devices", "Medias", "Lcom/ultron/player/data/remote/ApiType$Branches$GetBranch;", "Lcom/ultron/player/data/remote/ApiType$Brands$GetBrand;", "Lcom/ultron/player/data/remote/ApiType$Brands$Login;", "Lcom/ultron/player/data/remote/ApiType$Devices$BindDevice;", "Lcom/ultron/player/data/remote/ApiType$Devices$BindDeviceUUID;", "Lcom/ultron/player/data/remote/ApiType$Devices$GetDevice;", "Lcom/ultron/player/data/remote/ApiType$Devices$Schedules;", "Lcom/ultron/player/data/remote/ApiType$Devices$UpdateDevice;", "Lcom/ultron/player/data/remote/ApiType$Medias$UploadMedias;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
/* loaded from: classes.dex */
public abstract class ApiType {
    public static final String API_PATH = "https://ultrontest.ddns.net/api/v1";
    public static final String HOST = "https://ultrontest.ddns.net";
    public static final String VERSION = "v1";
    private final String url;

    public /* synthetic */ ApiType(DefaultConstructorMarker defaultConstructorMarker) {
        this();
    }

    private ApiType() {
        this.url = "";
    }

    public String getUrl() {
        return this.url;
    }

    /* compiled from: ApiType.kt */
    @Metadata(d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\bÆ\u0002\u0018\u00002\u00020\u0001:\u0002\u0005\u0006B\u0007\b\u0002¢\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T¢\u0006\u0002\n\u0000¨\u0006\u0007"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Brands;", "", "()V", "PATH", "", "GetBrand", "Login", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
    /* loaded from: classes4.dex */
    public static final class Brands {
        public static final Brands INSTANCE = new Brands();
        private static final String PATH = "brands";

        private Brands() {
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0005\u0018\u00002\u00020\u0001B\u0005¢\u0006\u0002\u0010\u0002J\u001e\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\u00042\u0006\u0010\n\u001a\u00020\u00042\u0006\u0010\u000b\u001a\u00020\u0004J\u0006\u0010\f\u001a\u00020\u0004R\u0014\u0010\u0003\u001a\u00020\u0004X\u0096D¢\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006¨\u0006\r"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Brands$Login;", "Lcom/ultron/player/data/remote/ApiType;", "()V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "bodyObj", "Lcom/ultron/player/data/model/api/request/LoginRequest;", "email", "ubn", "uuid", "genUUID", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class Login extends ApiType {
            private final String url;

            public Login() {
                super(null);
                this.url = "https://ultrontest.ddns.net/api/v1/brands/login";
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return this.url;
            }

            public final LoginRequest bodyObj(String email, String ubn, String uuid) {
                Intrinsics.checkNotNullParameter(email, "email");
                Intrinsics.checkNotNullParameter(ubn, "ubn");
                Intrinsics.checkNotNullParameter(uuid, "uuid");
                return new LoginRequest(email, ubn, uuid);
            }

            public final String genUUID() {
                String uuid = UUID.randomUUID().toString();
                Intrinsics.checkNotNullExpressionValue(uuid, "toString(...)");
                return uuid;
            }
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\t"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Brands$GetBrand;", "Lcom/ultron/player/data/remote/ApiType;", "brandId", "", "(I)V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        public static final class GetBrand extends ApiType {
            private final int brandId;

            public GetBrand(int i) {
                super(null);
                this.brandId = i;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/brands/" + this.brandId;
            }
        }
    }

    /* compiled from: ApiType.kt */
    @Metadata(d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\bÆ\u0002\u0018\u00002\u00020\u0001:\u0001\u0005B\u0007\b\u0002¢\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T¢\u0006\u0002\n\u0000¨\u0006\u0006"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Branches;", "", "()V", "PATH", "", "GetBranch", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
    /* loaded from: classes4.dex */
    public static final class Branches {
        public static final Branches INSTANCE = new Branches();
        private static final String PATH = "branches";

        private Branches() {
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\t"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Branches$GetBranch;", "Lcom/ultron/player/data/remote/ApiType;", "branchId", "", "(I)V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class GetBranch extends ApiType {
            private final int branchId;

            public GetBranch(int i) {
                super(null);
                this.branchId = i;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/branches/" + this.branchId;
            }
        }
    }

    /* compiled from: ApiType.kt */
    @Metadata(d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0006\bÆ\u0002\u0018\u00002\u00020\u0001:\u0005\u0005\u0006\u0007\b\tB\u0007\b\u0002¢\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T¢\u0006\u0002\n\u0000¨\u0006\n"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices;", "", "()V", "PATH", "", "BindDevice", "BindDeviceUUID", "GetDevice", "Schedules", "UpdateDevice", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
    /* loaded from: classes4.dex */
    public static final class Devices {
        public static final Devices INSTANCE = new Devices();
        private static final String PATH = "devices";

        private Devices() {
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0005\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004R\u0014\u0010\u0005\u001a\u00020\u00038VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0006\u0010\u0007R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000¨\u0006\b"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices$BindDeviceUUID;", "Lcom/ultron/player/data/remote/ApiType;", "uuid", "", "(Ljava/lang/String;)V", ImagesContract.URL, "getUrl", "()Ljava/lang/String;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class BindDeviceUUID extends ApiType {
            private final String uuid;

            /* JADX WARN: 'super' call moved to the top of the method (can break code semantics) */
            public BindDeviceUUID(String uuid) {
                super(null);
                Intrinsics.checkNotNullParameter(uuid, "uuid");
                this.uuid = uuid;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/devices/bind/" + this.uuid;
            }
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004J\u000e\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\u0006R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\f"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices$BindDevice;", "Lcom/ultron/player/data/remote/ApiType;", "deviceId", "", "(I)V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "bodyObj", "Lcom/ultron/player/data/model/api/request/BindDeviceRequest;", "key", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class BindDevice extends ApiType {
            private final int deviceId;

            public BindDevice(int i) {
                super(null);
                this.deviceId = i;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/devices/" + this.deviceId + "/bind";
            }

            public final BindDeviceRequest bodyObj(String key) {
                Intrinsics.checkNotNullParameter(key, "key");
                return new BindDeviceRequest(key);
            }
        }

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

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000R\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004J\u0016\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\u00062\u0006\u0010\f\u001a\u00020\u0006J\u000e\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u0006J\u001e\u0010\u0010\u001a\u00020\u00112\u0006\u0010\u0012\u001a\u00020\u00062\u0006\u0010\u0013\u001a\u00020\u00142\u0006\u0010\u0015\u001a\u00020\u0014J\u000e\u0010\u0016\u001a\u00020\u00172\u0006\u0010\u0018\u001a\u00020\u0006J\u0014\u0010\u0019\u001a\u00020\u001a2\f\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u001d0\u001cR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\u001e"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices$UpdateDevice;", "Lcom/ultron/player/data/remote/ApiType;", "deviceId", "", "(I)V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "deviceInfoBodyObj", "Lcom/ultron/player/data/model/api/request/UpdateDeviceInfo;", "model", "appVersion", "internetUpdatedBodyObj", "Lcom/ultron/player/data/model/api/request/UpdateInternetTime;", "dateTimeStr", "netInfoBodyObj", "Lcom/ultron/player/data/model/api/request/UpdateDeviceNetInfo;", "telecom", "uploadSpeed", "", "downloadSpeed", "screenShotBodyObj", "Lcom/ultron/player/data/model/api/request/UpdateDeviceScreenShot;", "screenShot", "statsBodyObj", "Lcom/ultron/player/data/model/api/request/UpdateDeviceStats;", "stats", "", "Lcom/ultron/player/data/model/api/request/Stats;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class UpdateDevice extends ApiType {
            private final int deviceId;

            public UpdateDevice(int i) {
                super(null);
                this.deviceId = i;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/devices/" + this.deviceId;
            }

            public final UpdateInternetTime internetUpdatedBodyObj(String dateTimeStr) {
                Intrinsics.checkNotNullParameter(dateTimeStr, "dateTimeStr");
                return new UpdateInternetTime(dateTimeStr);
            }

            public final UpdateDeviceInfo deviceInfoBodyObj(String model, String appVersion) {
                Intrinsics.checkNotNullParameter(model, "model");
                Intrinsics.checkNotNullParameter(appVersion, "appVersion");
                return new UpdateDeviceInfo(model, appVersion);
            }

            public final UpdateDeviceScreenShot screenShotBodyObj(String screenShot) {
                Intrinsics.checkNotNullParameter(screenShot, "screenShot");
                return new UpdateDeviceScreenShot(screenShot);
            }

            public final UpdateDeviceNetInfo netInfoBodyObj(String telecom, double uploadSpeed, double downloadSpeed) {
                Intrinsics.checkNotNullParameter(telecom, "telecom");
                return new UpdateDeviceNetInfo(telecom, Integer.valueOf((int) uploadSpeed), Integer.valueOf((int) downloadSpeed));
            }

            public final UpdateDeviceStats statsBodyObj(List<Stats> stats) {
                Intrinsics.checkNotNullParameter(stats, "stats");
                return new UpdateDeviceStats(stats);
            }
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0002\u0010\u0004R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000R\u0014\u0010\u0005\u001a\u00020\u00068VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\t"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Devices$GetDevice;", "Lcom/ultron/player/data/remote/ApiType;", "deviceId", "", "(I)V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        /* loaded from: classes.dex */
        public static final class GetDevice extends ApiType {
            private final int deviceId;

            public GetDevice(int i) {
                super(null);
                this.deviceId = i;
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/devices/" + this.deviceId;
            }
        }
    }

    /* compiled from: ApiType.kt */
    @Metadata(d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\bÆ\u0002\u0018\u00002\u00020\u0001:\u0001\u0005B\u0007\b\u0002¢\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T¢\u0006\u0002\n\u0000¨\u0006\u0006"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Medias;", "", "()V", "PATH", "", "UploadMedias", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
    /* loaded from: classes4.dex */
    public static final class Medias {
        public static final Medias INSTANCE = new Medias();
        private static final String PATH = "medias";

        private Medias() {
        }

        /* compiled from: ApiType.kt */
        @Metadata(d1 = {"\u0000\u001c\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u00002\u00020\u0001B\u0005¢\u0006\u0002\u0010\u0002J\u000e\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\u0004R\u0014\u0010\u0003\u001a\u00020\u00048VX\u0096\u0004¢\u0006\u0006\u001a\u0004\b\u0005\u0010\u0006¨\u0006\n"}, d2 = {"Lcom/ultron/player/data/remote/ApiType$Medias$UploadMedias;", "Lcom/ultron/player/data/remote/ApiType;", "()V", ImagesContract.URL, "", "getUrl", "()Ljava/lang/String;", "bodyObj", "Lcom/ultron/player/data/model/api/request/UploadMediasRequest;", "fileName", "app_productRelease"}, k = 1, mv = {1, 9, 0}, xi = 48)
        public static final class UploadMedias extends ApiType {
            public UploadMedias() {
                super(null);
            }

            @Override // com.ultron.player.data.remote.ApiType
            public String getUrl() {
                return "https://ultrontest.ddns.net/api/v1/medias/upload/urls";
            }

            public final UploadMediasRequest bodyObj(String fileName) {
                Intrinsics.checkNotNullParameter(fileName, "fileName");
                return new UploadMediasRequest(CollectionsKt.listOf(fileName));
            }
        }
    }

    protected final String genQueryStr(Map<String, ? extends Object> query) {
        Intrinsics.checkNotNullParameter(query, "query");
        String str = "";
        int i = 0;
        for (Map.Entry<String, ? extends Object> entry : query.entrySet()) {
            String str2 = i == 0 ? "?" : "&";
            String key = entry.getKey();
            str = ((Object) str) + str2 + ((Object) key) + "=" + entry.getValue();
            i++;
        }
        return str;
    }
}
