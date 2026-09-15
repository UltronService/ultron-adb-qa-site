                    } else {
                        downloadInfo = null;
                    }
                    mutableLiveData5.postValue(downloadInfo);
                    downloadFragmentViewModel.saveSchedule(brandsSchedules);
                    downloadFragmentViewModel.download(arrayList2);
                } else {
                    int code = response.code();
                    mutableLiveData3 = downloadFragmentViewModel.mScheduleApiInfo;
                    mutableLiveData3.postValue("Failed: " + code);
                    downloadFragmentViewModel.debugLog.updateLog(DownloadFragmentViewModel.TAG, "[UpdateSchedule][error status code: " + code + "] " + response.message());
                    downloadFragmentViewModel.debugLog.sendDownloadPageLog();
                    DownloadFragmentViewModel.play$default(downloadFragmentViewModel, null, 5000L, 1, null);
                }
                Unit unit = Unit.INSTANCE;
                CloseableKt.closeFinally(schedule, null);
                this.this$0.getMShowLoading$app_productRelease().postValue(new Pair<>(Boxing.boxBoolean(false), null));
            } finally {
            }
        } catch (Exception e) {
            String message = e.getMessage();
            if (message == null) {
                message = "Unknown error";
            }
            mutableLiveData = this.this$0.mScheduleApiInfo;
            mutableLiveData.postValue("Failed: " + message);
            this.this$0.debugLog.updateLog(DownloadFragmentViewModel.TAG, "[UpdateSchedule][error] " + message);
            this.this$0.debugLog.sendDownloadPageLog();
            this.this$0.getMShowLoading$app_productRelease().postValue(new Pair<>(Boxing.boxBoolean(false), null));
            this.this$0.debugView.updateText("[DownloadVM][updateSchedule][error] " + message);
            DownloadFragmentViewModel.play$default(this.this$0, null, 5000L, 1, null);
