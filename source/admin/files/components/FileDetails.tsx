import { useState, useEffect } from "@wordpress/element";
import { useCustomAlert } from "~/components/alert/Alert";
import { useUpdateFileMetadataMutation } from "~/redux/api/media";
import useFileActions from "../hooks/useFileActions";
import { formatFileSize } from "~/utils/functions";
import InlineStack from "~/components/inlineStack";
import BlockStack from "~/components/blockStack";
import IconButton from "~/components/iconButton";
import Tooltip from "~/components/tooltip";
import { useDeleteFile } from "./Delete";
import Avatar from "~/components/avatar";
import Button from "~/components/button";
import Input from "~/components/input";
import useFile from "../hooks/useFile";
import { __ } from "@wordpress/i18n";
import Card from "~/components/card";
import Text from "~/components/text";
import Icon from "~/components/icon";
import { File } from "~/types/file";

const FileDetails = ({ onClose }: { onClose: () => void }) => {
    const { setFile, detailsFile } = useFile();

    const {
        getFileLink,
    } = useFileActions();

    const { openDeleteFile } = useDeleteFile();
    const [updateMetadata, { isLoading: isSaving }] = useUpdateFileMetadataMutation();

    const { id, name, url, extension, size, location, createdAt, updatedAt, alt, caption, description } =
        detailsFile || {};

    const [metaTitle, setMetaTitle]       = useState( name        ?? "" );
    const [metaAlt, setMetaAlt]           = useState( alt         ?? "" );
    const [metaCaption, setMetaCaption]   = useState( caption     ?? "" );
    const [metaDesc, setMetaDesc]         = useState( description ?? "" );
    const [saveStatus, setSaveStatus]     = useState<"idle" | "success" | "error">( "idle" );

    useEffect( () => {
        setMetaTitle( name        ?? "" );
        setMetaAlt(   alt         ?? "" );
        setMetaCaption( caption   ?? "" );
        setMetaDesc( description  ?? "" );
        setSaveStatus( "idle" );
    }, [ id ] );

    const handleClose = () => {
        setFile( "detailsFile", null );
        onClose();
    };

    const handleSave = async () => {
        if ( ! id ) return;
        setSaveStatus( "idle" );
        try {
            await updateMetadata( {
                id,
                title:       metaTitle,
                alt:         metaAlt,
                caption:     metaCaption,
                description: metaDesc,
            } ).unwrap();
            setSaveStatus( "success" );
            setTimeout( () => setSaveStatus( "idle" ), 2500 );
        } catch {
            setSaveStatus( "error" );
        }
    };

    const openImageEditor = () => {
        const editorUrl = `${ pnpnm?.siteUrl ?? "" }/wp-admin/post.php?post=${ id }&action=edit&open_pnpnm_editor=${ id }`;
        window.open( editorUrl, "_blank" );
    };

    const isImage = [ "jpg", "jpeg", "png", "gif", "webp", "avif" ].includes(
        ( extension ?? "" ).toLowerCase()
    );

    return (
        <Card padding={0} background="white" borderStyle="none" rounded="md">
            <InlineStack align="between" gap={10}>
                <Text size="sm">
                    { __( "Media Details", "ninja-media" ) } { id }
                </Text>

                <IconButton
                    variant="error"
                    size="microsmall"
                    name="close"
                    style={{ borderRadius: "5px" }}
                    onClick={handleClose}
                />
            </InlineStack>

            <Card
                marginTop={15}
                padding={0}
                background="extralight"
                rounded="md"
                style={{ height: "220px" }}
            >
                <Avatar
                    src={ `${ url }?v=${ updatedAt }` }
                    alt={ name }
                    width="100%"
                    height="100%"
                    rounded="md"
                    objectFit="contain"
                    showSpinner
                />
            </Card>

            {/* ── File info ── */}
            <InlineStack gap={20} wrap={false} style={{ marginTop: 10 }}>
                <BlockStack gap={5}>
                    <Text size="sm">{ __( "Name:", "ninja-media" ) }</Text>
                    <Text size="sm">{ __( "Type:", "ninja-media" ) }</Text>
                    <Text size="sm">{ __( "Size:", "ninja-media" ) }</Text>
                    <Text size="sm">{ __( "Date:", "ninja-media" ) }</Text>
                </BlockStack>

                <BlockStack gap={5} style={{ minWidth: 0 }}>
                    <Text color="descgray" size="sm" wrap={false} ellipsis style={{ minWidth: 0 }}>
                        { name }
                    </Text>
                    <Text color="descgray" size="sm">{ extension }</Text>
                    <Text color="descgray" size="sm">{ formatFileSize( size ?? 0 ) }</Text>
                    <Text color="descgray" size="sm">{ createdAt }</Text>
                </BlockStack>
            </InlineStack>

            {/* ── Location ── */}
            <BlockStack marginTop={15} gap={ location?.length === 0 ? 0 : 8 }>
                <Text size="sm">
                    { location?.length === 0
                        ? __( "Location not Found", "ninja-media" )
                        : __( "Location:", "ninja-media" ) }
                </Text>

                <BlockStack gap={5} style={{ marginLeft: 10 }}>
                    { location?.map( ( { name: locName, url: locUrl }, index ) => (
                        <InlineStack key={index} gap={10} wrap={false}>
                            <Text color="descgray" size="sm" wrap={false}>{ index + 1 }.</Text>
                            <Text color="descgray" size="sm" wrap={false}>{ locName }</Text>
                            <Icon
                                name="open_in_new"
                                color="primary"
                                style={{ cursor: "pointer" }}
                                onClick={ () => window.open( locUrl, "_blank" ) }
                            />
                        </InlineStack>
                    ) ) }
                </BlockStack>
            </BlockStack>

            {/* ── Metadata fields ── */}
            <BlockStack marginTop={18} gap={10}>
                <Text size="sm" style={{ fontWeight: 600 }}>
                    { __( "Metadata", "ninja-media" ) }
                </Text>

                <Input
                    label={ __( "Title", "ninja-media" ) }
                    value={ metaTitle }
                    size="small"
                    placeholder={ __( "Image title", "ninja-media" ) }
                    onChange={ ( v ) => setMetaTitle( String( v ) ) }
                />

                <Input
                    label={ __( "Alt Text", "ninja-media" ) }
                    value={ metaAlt }
                    size="small"
                    placeholder={ __( "Describe the image for accessibility", "ninja-media" ) }
                    onChange={ ( v ) => setMetaAlt( String( v ) ) }
                />

                <Input
                    label={ __( "Caption", "ninja-media" ) }
                    value={ metaCaption }
                    size="small"
                    placeholder={ __( "Short caption shown below the image", "ninja-media" ) }
                    onChange={ ( v ) => setMetaCaption( String( v ) ) }
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 500 }}>
                        { __( "Description", "ninja-media" ) }
                    </label>
                    <textarea
                        rows={3}
                        value={ metaDesc }
                        placeholder={ __( "Longer description of the image", "ninja-media" ) }
                        onChange={ ( e ) => setMetaDesc( e.target.value ) }
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 10px",
                            fontSize: 13,
                            borderRadius: 4,
                            border: "1px solid #dcdcde",
                            resize: "vertical",
                            fontFamily: "inherit",
                        }}
                    />
                </div>

                <InlineStack align="between" gap={10}>
                    <Button
                        variant="primary"
                        size="small"
                        loading={ isSaving }
                        onClick={ handleSave }
                    >
                        { __( "Save Metadata", "ninja-media" ) }
                    </Button>

                    { saveStatus === "success" && (
                        <Text size="sm" color="success">
                            { __( "✓ Saved", "ninja-media" ) }
                        </Text>
                    ) }
                    { saveStatus === "error" && (
                        <Text size="sm" color="error">
                            { __( "Save failed", "ninja-media" ) }
                        </Text>
                    ) }
                </InlineStack>
            </BlockStack>

            {/* ── Action icons ── */}
            <InlineStack marginTop={20} gap={15} align="end">
                { isImage && (
                    <Tooltip title={ __( "Open in Image Editor", "ninja-media" ) } arrow wrap="no-wrap">
                        <Icon
                            name="edit"
                            color="primary"
                            fontSize="xl"
                            style={{ cursor: "pointer" }}
                            onClick={ openImageEditor }
                        />
                    </Tooltip>
                ) }

                <Tooltip
                    title={ pnpnm?.isPro ? __( "Download", "ninja-media" ) : __( "Premium Only", "ninja-media" ) }
                    arrow
                    wrap="no-wrap"
                >
                    <Icon
                        name="download"
                        color="primary"
                        fontSize="2xl"
                        style={{ cursor: "pointer" }}
                        onClick={ () => {
                        } }
                    />
                </Tooltip>

                <Tooltip title={ __( "Copy URL", "ninja-media" ) } arrow wrap="no-wrap">
                    <Icon
                        name="link"
                        color="primary"
                        fontSize="2xl"
                        style={{ cursor: "pointer" }}
                        onClick={ () => getFileLink( detailsFile as File ) }
                    />
                </Tooltip>

                <Tooltip title={ __( "Open in Media Library", "ninja-media" ) } arrow wrap="no-wrap">
                    <Icon
                        name="open_in_new"
                        color="primary"
                        fontSize="xl"
                        style={{ cursor: "pointer" }}
                        onClick={ () => window.open( `${ pnpnm?.siteUrl }/wp-admin/upload.php?item=${ id }`, "_blank" ) }
                    />
                </Tooltip>

                { detailsFile?.location?.length === 0 && (
                    <Tooltip title={ __( "Delete", "ninja-media" ) } arrow wrap="no-wrap">
                        <Icon
                            name="delete"
                            color="error"
                            fontSize="xl"
                            style={{ cursor: "pointer" }}
                            onClick={ () => openDeleteFile( [ Number( id ) ] ) }
                        />
                    </Tooltip>
                ) }
            </InlineStack>
        </Card>
    );
};

export const useViewDetails = () => {
    const { showAlert, closeAlert } = useCustomAlert();

    const openViewDetails = () => {
        showAlert( {
            id:                "view-details-modal",
            type:              "info",
            showIcon:          false,
            showConfirmButton: false,
            allowEscapeKey:    false,
            width:             "600px",
            height:            "fit-content",
            html: (
                <FileDetails onClose={ () => closeAlert( "view-details-modal" ) } />
            ),
        } );
    };

    return { openViewDetails };
};
