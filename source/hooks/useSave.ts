import { useUpdateSettingsMutation } from "~/redux/api/settings";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { useCustomAlert } from "~/components/alert/Alert";
import { useEffect, useState } from "@wordpress/element";
import { NestedKey, NestedValue } from "~/utils/types";
import { objectEqual } from "~/utils/functions";
import { Settings } from "~/types/settings";
import {
    selectSettings,
    setDraft,
    updateSettings,
} from "~/redux/features/settings";

const useSave = () => {
    const { data, draft } = useAppSelector(selectSettings);
    const [isDataChanged, setIsDataChanged] = useState(false);

    const [updateSettingsData] = useUpdateSettingsMutation();

    const dispatch = useAppDispatch();

    const { showAlert } = useCustomAlert();

    useEffect(() => {
        if (data && draft) {
            setIsDataChanged(!objectEqual(data, draft));
        } else {
            setIsDataChanged(false);
        }
    }, [data, draft]);

    const saveSettingsData = async (propsData?: Settings) => {
        if (!data) return;

        try {
            const response = await updateSettingsData(
                propsData || data,
            ).unwrap();

            dispatch(setDraft(propsData || data));

            showAlert({
                toast: true,
                type: "success",
                text: response?.message || "Settings saved successfully",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        } catch (error: any) {
            showAlert({
                toast: true,
                type: "error",
                text: error?.data?.message || "Failed to save settings",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
    };

    const saveSettings = <Path extends NestedKey<Settings>>(
        path: Path,
        value: NestedValue<Settings, Path>,
    ) => {
        dispatch(updateSettings({ path, value }));
    };

    return { isDataChanged, saveSettings, saveSettingsData };
};

export default useSave;
