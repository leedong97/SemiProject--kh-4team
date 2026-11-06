export default function PageHeading({ eyebrow, title, description }) {
    return (
        <div className="nexus-extra-heading">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
        </div>
    );
}
