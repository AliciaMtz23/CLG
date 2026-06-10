import { FiZap } from "react-icons/fi";
import "../about.css";

const AboutCard = ({icon, title, description}) => {
    return (
        <div className="valor-card">
            <div className="valor-icono">
                {icon}
            </div>
            <h3 className="valor-titulo">{title}</h3>
            <p className="valor-desc">
                {description}
            </p>
        </div>
    )
}

export default AboutCard;