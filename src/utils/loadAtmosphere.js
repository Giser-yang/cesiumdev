const atmosphereShader = `
precision highp float;
    uniform float earthRadius;
    uniform float bDensity;
    uniform vec4 bColor;

    const float PI = 3.14159265359;
    const float TWO_PI = 6.28318530718;
    const float FOUR_PI = 12.5663706144;

    #define PRIMARY_STEPS 16
    #define LIGHT_STEPS 4
    #define CLOUDS_MAX_LOD 1
    #define CLOUDS_MARCH_STEP 500.0
    #define CLOUDS_DENS_MARCH_STEP 100.0
    #define MAXIMUM_CLOUDS_STEPS 300
    #define DISTANCE_QUALITY_RATIO 0.00003

    #define CLOUDS_MAX_VIEWING_DISTANCE 250000.0

    vec2 raySphereIntersect(vec3 r0, vec3 rd, float sr) {
      float a = dot(rd, rd);
      float b = 2.0 * dot(rd, r0);
      float c = dot(r0, r0) - (sr * sr);
      float d = (b * b) - 4.0 * a * c;

      if (d < 0.0) return vec2(-1.0, -1.0);
      float squaredD = sqrt(d);

      return vec2(
        (-b - squaredD) / (2.0 * a),
        (-b + squaredD) / (2.0 * a)
      );
    }

    float reMap (float value, float old_low, float old_high, float new_low, float new_high ) {
      return new_low + (value - old_low) * (new_high - new_low) / (old_high - old_low);
    }

    float saturate (float value) {
      return clamp(value, 0.0, 1.0);
    }

    float isotropic() {
      return 0.07957747154594767; //1.0 / (4.0 * PI);
    }

    float rayleigh(float costh) {
      return (3.0 / (16.0 * PI)) * (1.0 + pow(costh, 2.0));
    }

    float HenyeyGreenstein(float g, float costh)
    {
      return (1.0 - g * g) / (FOUR_PI * pow(1.0 + g * g - 2.0 * g * costh, 3.0 / 2.0));
    }

    float Schlick(float k, float costh) {
      return (1.0 - k * k) / (FOUR_PI * pow(1.0 - k * costh, 2.0));
    }

    // how bright the light is, affects the brightness of the atmosphere
    vec3 light_intensity = vec3(70.0);//vec3(100.0);

    // the amount rayleigh scattering scatters the colors (for earth: causes the blue atmosphere)
    vec3 beta_ray = vec3(5.5e-6, 13.0e-6, 22.4e-6);//vec3(5.5e-6, 13.0e-6, 22.4e-6);

    // the amount mie scattering scatters colors
    vec3 beta_mie = vec3(21e-6); // vec3(21e-6);

    // the amount of scattering that always occurs, can help make the back side of the atmosphere a bit brighter
    vec3 beta_ambient = vec3(0.0);

    // the direction mie scatters the light in (like a cone). closer to -1 means more towards a single direction
    float g = 0.9;

    // how high do you have to go before there is no rayleigh scattering?
    float height_ray = 10e3;

    // the same, but for mie
    float height_mie = 3.2e3;

    // 1.0 - how much extra the atmosphere blocks light
    float density_multiplier = 4.0;

    vec4 calculate_scattering(
    vec3 start, // the start of the ray (the camera position)
    vec3 dir, // the direction of the ray (the camera vector)
    float maxDistance, // the maximum distance the ray can travel (because something is in the way, like an object)
    vec3 light_dir) {
      float a = dot(dir, dir);
      float b = 2.0 * dot(dir, start);
      float atmoRadiusSquared=pow((earthRadius+101000.),2.);
      float planetRadius=earthRadius-10000.;
      float c = dot(start, start) - atmoRadiusSquared;
      float d = (b * b) - 4.0 * a * c;
      if (d < 0.0) return vec4(0.0);
      float squaredD = sqrt(d);
      // 射线的起点和终点
      vec2 ray_length = vec2(
        max((-b - squaredD) / (2.0 * a), 0.0),
        min((-b + squaredD) / (2.0 * a), maxDistance)
      );
      if (ray_length.x > ray_length.y) return vec4(0.0);
      bool allow_mie = maxDistance > ray_length.y;
      float step_size_i = (ray_length.y - ray_length.x) / float(PRIMARY_STEPS);
      float ray_pos_i = ray_length.x;
      vec3 total_ray = vec3(0.0); // for rayleigh
      vec3 total_mie = vec3(0.0); // for mie
      vec2 opt_i = vec2(0.0);
      vec2 scale_height = vec2(height_ray, height_mie);
      float mu = dot(dir, light_dir);
      float mumu = mu * mu;
      float gg = g * g;
      float phase_ray = 3.0 / (50.2654824574 ) * (1.0 + mumu);
      float phase_mie = (allow_mie ? 3.0 : 0.5 ) / (25.1327412287 ) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));
      for (int i = 0; i < PRIMARY_STEPS; ++i) {
        vec3 pos_i = start + dir * (ray_pos_i + step_size_i);
        float height_i = length(pos_i) - planetRadius;
        vec2 density = exp(-height_i / scale_height) * step_size_i;
        opt_i += density;
        a = dot(light_dir, light_dir);
        b = 2.0 * dot(light_dir, pos_i);
        c = dot(pos_i, pos_i) - atmoRadiusSquared;
        d = (b * b) - 4.0 * a * c;
        if (d <= 0.0) d = 1.0; // not supposed to be required but this avoids the black singularity line at dusk and dawn
        float step_size_l = (-b + sqrt(d)) / (2.0 * a * float(LIGHT_STEPS));
        float ray_pos_l = 0.0;
        vec2 opt_l = vec2(0.0);
        for (int l = 0; l < LIGHT_STEPS; ++l) {
          vec3 pos_l = pos_i + light_dir * (ray_pos_l + step_size_l * 0.5);
          float height_l = length(pos_l) - planetRadius;
          opt_l += exp(-height_l / scale_height) * step_size_l;
          ray_pos_l += step_size_l;
        }
        vec3 attn = exp(-((beta_mie * (opt_i.y + opt_l.y)) + (beta_ray * (opt_i.x + opt_l.x))));
        total_ray += density.x * attn;
        total_mie += density.y * attn;
        ray_pos_i += step_size_i;
      }
      float opacity = length(exp(-((beta_mie * opt_i.y) + (beta_ray * opt_i.x)) * density_multiplier));
      return vec4((
          phase_ray * beta_ray * total_ray // rayleigh color
          + phase_mie * beta_mie * total_mie // mie
          + opt_i.x * beta_ambient // and ambient
        ) * light_intensity, 1.0 - opacity);
    }

    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    in vec2 v_textureCoordinates;

    void main() {
      vec4 color = texture(colorTexture, v_textureCoordinates);
      vec4 rawDepthColor = texture(depthTexture, v_textureCoordinates);
      float depth = rawDepthColor.r;

      vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
      vec4 worldCoordinate = czm_inverseView * positionEC;
      vec3 vWorldPosition = worldCoordinate.xyz / worldCoordinate.w;
      vec3 posToEye = vWorldPosition - czm_viewerPositionWC;
      vec3 direction = normalize(posToEye);
      vec3 lightDirection = normalize(czm_sunPositionWC);
      float distance = length(posToEye);
      float elevation;

      if (depth >= 1.0) {
        elevation = length(czm_viewerPositionWC) - (earthRadius);
        distance = max(distance, 10000000.0);
      } else {
        elevation = length(vWorldPosition) - (earthRadius);
      }

      vec4 atmosphereColor = calculate_scattering(
      czm_viewerPositionWC,
      direction,
      distance,
      lightDirection
      );
      color = atmosphereColor + color * (1.0 - atmosphereColor.a);
      float exposure = 1.2;
      color = vec4(0.85 - exp(-exposure * color));

      float backFogDensity;
      backFogDensity += bDensity * depth;
      color = mix(color, vec4(bColor.rgb, 1.0), clamp(backFogDensity, 0.0, 1.0));
      out_FragColor = color;
    }
`
const addAtmosphere = (viewer) => {
  const camera = viewer.camera;
  const state = new Cesium.PostProcessStage({
    uniforms: {
      bDensity: 0.01,
      bColor: () => {
        return Cesium.Color.fromCssColorString("#b6d3f5ff");
      },
      earthRadius: () =>
        Cesium["Cartesian3"]["magnitude"](camera["positionWC"]) -
        camera["positionCartographic"]["height"],
    },
    fragmentShader: atmosphereShader,
  });

  viewer.scene.postProcessStages.add(state);
  window.state = state;
};
export {addAtmosphere}