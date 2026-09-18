package com.eshoppingzone.shipping.provider;

import com.eshoppingzone.shipping.provider.dto.CancelShipmentResponse;
import com.eshoppingzone.shipping.provider.dto.ShipmentCreationRequest;
import com.eshoppingzone.shipping.provider.dto.ShipmentProviderResponse;
import com.eshoppingzone.shipping.provider.dto.TrackingProviderResponse;

public interface ShippingProvider {

    String getProviderName();

    ShipmentProviderResponse createShipment(ShipmentCreationRequest request);

    TrackingProviderResponse getTracking(String trackingNumber);

    CancelShipmentResponse cancelShipment(String providerShipmentId);
}
