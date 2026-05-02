import { useLayoutEffect, useRef } from "@wordpress/element";
import SkeletonLoader from "~/components/skeletonLoader";
import { selectFiles } from "~/redux/features/files";
import BlockStack from "~/components/blockStack";
import { useAppSelector } from "~/redux/hooks";
import GridStack from "~/components/gridStack";
import { useNavigate } from "react-router-dom";
import Card from "~/components/card";
import Icon from "~/components/icon";
import Text from "~/components/text";

const DynamicFiles = ({ loading }: { loading: boolean }) => {
    const { dynamicFolders } = useAppSelector(selectFiles);
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const cards = containerRef.current?.querySelectorAll(
            ".pnpnm-dynamic-card",
        );

        if (!cards) return;

        const parentRect = containerRef.current!.getBoundingClientRect();
        const centerX = parentRect.left + parentRect.width / 2;
        const centerY = parentRect.top + parentRect.height / 2;

        const transforms: { el: HTMLElement; dx: number; dy: number }[] = [];

        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();

            const dx = centerX - (rect.left + rect.width / 2);
            const dy = centerY - (rect.top + rect.height / 2);

            transforms.push({
                el: card as HTMLElement,
                dx,
                dy,
            });
        });

        transforms.forEach(({ el, dx, dy }) => {
            el.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
            el.style.opacity = "0";
        });

        requestAnimationFrame(() => {
            transforms.forEach(({ el }, i) => {
                el.style.transition =
                    "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s";
                el.style.transform = "translate(0, 0) scale(1)";
                el.style.opacity = "1";
                el.style.transitionDelay = `${i * 0.08}s`;
            });
        });
    }, [dynamicFolders]);

    const handleFolderClick = (key: string) => {
        navigate(`/files/dynamic/${key}`);
    };

    if (!loading && Object.keys(dynamicFolders).length === 0) {
        return (
            <BlockStack
                align="center"
                inlineAlign="center"
                gap={10}
                style={{
                    marginTop: "50px",
                }}
            >
                <Text size="xl" weight="semibold" align="center">
                    No dynamic folders found
                </Text>

                <Text size="sm" align="center">
                    Dynamic folders are automatically created based on file
                    extensions. Once you have files <br /> with different
                    extensions, dynamic folders will appear here.
                </Text>
            </BlockStack>
        );
    }

    return (
        <GridStack
            ref={containerRef}
            gap={15}
            columns="auto-fill"
            min="400px"
            marginTop={20}
        >
            {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                      <Card
                          key={index}
                          padding={0}
                          background="transparent"
                          flex
                          direction="col"
                          align="center"
                          blockAlign="center"
                          gap={15}
                          style={{
                              height: "200px",
                          }}
                      >
                          <SkeletonLoader
                              width="100%"
                              height="100%"
                              rounded="lg"
                          />
                      </Card>
                  ))
                : Object.entries(dynamicFolders).map(([key, count], index) => (
                      <Card
                          key={key ?? index}
                          background="white"
                          flex
                          direction="col"
                          align="center"
                          blockAlign="center"
                          gap={15}
                          style={{
                              position: "relative",
                              height: "200px",
                              cursor: "pointer",
                          }}
                          className="pnpnm-dynamic-card"
                          onClick={() => handleFolderClick(key)}
                      >
                          <Icon
                              name="image"
                              color="primary"
                              style={{
                                  fontSize: "35px",
                              }}
                          />

                          <Text color="primary" size="xl">
                              {key}
                          </Text>

                          <Text
                              color="primary"
                              size="lg"
                              style={{
                                  position: "absolute",
                                  top: "15px",
                                  right: "15px",
                              }}
                          >
                              {count}
                          </Text>
                      </Card>
                  ))}
        </GridStack>
    );
};

export default DynamicFiles;
