//go:build no_runtime_type_checking

package k8s

// Building without runtime type checking enabled, so all the below just return nil

func validateKubeCronJobV2Alpha1_IsApiObjectParameters(o interface{}) error {
	return nil
}

func validateKubeCronJobV2Alpha1_IsConstructParameters(x interface{}) error {
	return nil
}

func validateKubeCronJobV2Alpha1_ManifestParameters(props *KubeCronJobV2Alpha1Props) error {
	return nil
}

func validateKubeCronJobV2Alpha1_OfParameters(c constructs.IConstruct) error {
	return nil
}

func validateNewKubeCronJobV2Alpha1Parameters(scope constructs.Construct, id *string, props *KubeCronJobV2Alpha1Props) error {
	return nil
}
