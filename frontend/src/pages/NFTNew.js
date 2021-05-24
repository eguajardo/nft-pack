import { useEthers } from "@usedapp/core";

function NFTNew() {

    const { chainId } = useEthers();

    return (
        <div className="container content-container">
            {chainId}
        </div>
    );
}

export default NFTNew;