const Windows = ({ color }: { color?: string | null }) => {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M7.28438 2.90625L5.9125 1.88437C5.5875 1.64375 5.19687 1.51562 4.79375 1.51562H0.9375C0.41875 1.51562 0 1.93437 0 2.45312V13.5469C0 14.0656 0.41875 14.4844 0.9375 14.4844H15.0625C15.5813 14.4844 16 14.0656 16 13.5469V4.21562C16 3.69687 15.5813 3.27813 15.0625 3.27813H8.40312C8 3.275 7.60938 3.14688 7.28438 2.90625Z"
                fill={color ?? "#FFC321"}
            />
            <path
                d="M0 4.82812H16V8.89062H0V4.82812Z"
                fill="url(#paint0_linear_345_4067)"
            />
            <rect
                x="2.21875"
                y="4.17822"
                width="12.1875"
                height="7.1875"
                rx="1"
                fill="url(#paint1_linear_345_4067)"
                fill-opacity="0.5"
            />
            <foreignObject
                x="-8.40625"
                y="-5.19678"
                width="32.1875"
                height="27.1875"
            >
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                        backdropFilter: "blur(5px)",
                        clipPath: "url(#bgblur_0_345_4067_clip_path)",
                        height: "100%",
                        width: "100%",
                    }}
                ></div>
            </foreignObject>
            <path
                data-figma-bg-blur-radius="10"
                d="M2.0625 4.80322H13.3125C13.5719 4.80322 13.7812 5.0126 13.7812 5.27197V11.522C13.7812 11.7813 13.5719 11.9907 13.3125 11.9907H2.0625C1.80312 11.9907 1.59375 11.7813 1.59375 11.522V5.27197C1.59375 5.0126 1.80312 4.80322 2.0625 4.80322Z"
                fill="url(#paint2_linear_345_4067)"
            />
            <path
                d="M0.9375 5.76562H15.0625C15.5813 5.76562 16 6.18437 16 6.70312V13.5469C16 14.0656 15.5813 14.4844 15.0625 14.4844H0.9375C0.41875 14.4844 0 14.0656 0 13.5469V6.70312C0 6.18437 0.41875 5.76562 0.9375 5.76562Z"
                fill={color ?? "#FFC321"}
            />
            <path
                d="M0.9375 5.76562H15.0625C15.5813 5.76562 16 6.18437 16 6.70312V13.5469C16 14.0656 15.5813 14.4844 15.0625 14.4844H0.9375C0.41875 14.4844 0 14.0656 0 13.5469V6.70312C0 6.18437 0.41875 5.76562 0.9375 5.76562Z"
                fill="url(#paint3_linear_345_4067)"
            />
            <defs>
                <clipPath
                    id="bgblur_0_345_4067_clip_path"
                    transform="translate(8.40625 5.19678)"
                >
                    <path d="M2.0625 4.80322H13.3125C13.5719 4.80322 13.7812 5.0126 13.7812 5.27197V11.522C13.7812 11.7813 13.5719 11.9907 13.3125 11.9907H2.0625C1.80312 11.9907 1.59375 11.7813 1.59375 11.522V5.27197C1.59375 5.0126 1.80312 4.80322 2.0625 4.80322Z" />
                </clipPath>
                <linearGradient
                    id="paint0_linear_345_4067"
                    x1="8"
                    y1="8.89062"
                    x2="8"
                    y2="4.82812"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-opacity="0.25" />
                    <stop offset="1" stop-opacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_345_4067"
                    x1="2.64062"
                    y1="4.1876"
                    x2="16.0938"
                    y2="11.3751"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.5" />
                    <stop offset="1" stop-color="white" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_345_4067"
                    x1="1.76562"
                    y1="4.8126"
                    x2="15.9844"
                    y2="15.2501"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" stop-opacity="0.5" />
                    <stop offset="1" stop-color="white" />
                </linearGradient>
                <linearGradient
                    id="paint3_linear_345_4067"
                    x1="-9.84375"
                    y1="-11.0469"
                    x2="13.9051"
                    y2="16.0301"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="white" />
                    <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default Windows;
